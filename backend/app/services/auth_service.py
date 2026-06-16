import logging
import secrets
import hashlib
from datetime import datetime, timedelta, timezone

from app.repositories.user_repository import UserRepository
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import UserCreate, UserLogin, PasswordResetRequest, PasswordResetConfirm
from app.services.email_service import EmailService
from app.core.config import get_settings

logger = logging.getLogger(__name__)

RESET_TOKEN_EXPIRE_HOURS = 1


class AuthService:
    def __init__(self, repo: UserRepository) -> None:
        self._repo = repo
        _settings = get_settings()
        self._email_service = EmailService(api_key=_settings.resend_api_key)
        self._base_url = _settings.base_url

    def register_user(self, user_data: UserCreate) -> str:
        logger.info("Iniciando cadastro para e-mail: [REDACTED]")
        if self._repo.email_exists(user_data.email):
            raise ValueError("Não foi possível realizar o cadastro.")
        hashed = hash_password(user_data.password)
        user = self._repo.create_user(email=user_data.email, hashed_password=hashed, nome=user_data.nome)
        token = create_access_token(data={"sub": str(user["id"])})
        logger.info("Cadastro concluído: user_id=%s", user["id"])
        return token

    # ── NOVO ──────────────────────────────────────────────────────────────

    def login_mobile(self, credentials: UserLogin) -> dict:
        """Login para mobile — retorna JSON com token e nome."""
        user = self._repo.get_by_email(credentials.email)
        dummy_hash = "$2b$12$inexistenteHashParaTimingConstante000000000000000000000"
        stored_hash = user["password_hash"] if user else dummy_hash
        password_ok = verify_password(credentials.password, stored_hash)
        if not user or not password_ok:
            raise ValueError("Credenciais inválidas.")
        token = create_access_token(data={"sub": str(user["id"])})
        logger.info("Login mobile: user_id=%s", user["id"])
        return {"token": token, "nome": user.get("name") or "", "user_id": str(user["id"])}

    def register_mobile(self, user_data: UserCreate) -> dict:
        """Cadastro para mobile — retorna JSON com token e nome."""
        if self._repo.email_exists(user_data.email):
            raise ValueError("E-mail já cadastrado.")
        hashed = hash_password(user_data.password)
        user = self._repo.create_user(email=user_data.email, hashed_password=hashed, nome=user_data.nome)
        token = create_access_token(data={"sub": str(user["id"])})
        logger.info("Cadastro mobile: user_id=%s", user["id"])
        return {"token": token, "nome": user_data.nome, "user_id": str(user["id"])}

    def login_user(self, credentials: UserLogin) -> str:
        """
        Verifica credenciais e retorna JWT.
        Mensagem de erro genérica — não revela qual campo está errado.
        Raises:
            ValueError: credenciais inválidas.
        """
        logger.info("Tentativa de login: [REDACTED]")

        user = self._repo.get_by_email(credentials.email)

        # Tempo constante: verifica hash mesmo se usuário não existe
        # para evitar timing attack que revela se e-mail está cadastrado
        dummy_hash = "$2b$12$inexistenteHashParaTimingConstante000000000000000000000"
        stored_hash = user["password_hash"] if user else dummy_hash

        password_ok = verify_password(credentials.password, stored_hash)

        if not user or not password_ok:
            raise ValueError("Credenciais inválidas.")

        token = create_access_token(data={"sub": str(user["id"])})
        logger.info("Login bem-sucedido: user_id=%s", user["id"])
        return token

    def request_password_reset(self, data: PasswordResetRequest) -> str | None:
        """
        Gera token de recuperação e retorna o token em texto claro para envio por e-mail.
        Salva apenas o HASH do token no banco.
        Retorna None se e-mail não existir (resposta idêntica para não revelar cadastro).
        """
        user = self._repo.get_by_email(data.email)
        print(f"[DEBUG] request_password_reset chamado. user encontrado: {bool(user)}", flush=True)
        if not user:
            # Resposta silenciosa — não revela se e-mail existe
            logger.info("Reset solicitado para e-mail não cadastrado: [REDACTED]")
            return None

        # Token criptograficamente seguro de 32 bytes = 64 chars hex
        raw_token = secrets.token_hex(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        expires_at = (
            datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
        ).isoformat()

        self._repo.save_reset_token(
            user_id=str(user["id"]),
            token_hash=token_hash,
            expires_at=expires_at,
        )

        reset_url = f"{self._base_url}/reset-password?token={raw_token}"
        self._email_service.send_reset_email(
            to_email=data.email,
            reset_url=reset_url,
        )

        logger.info("Token de recuperação gerado: user_id=%s", user["id"])
        return raw_token

    def reset_password(self, data: PasswordResetConfirm) -> None:
        """
        Valida token e atualiza senha.
        Raises:
            ValueError: token inválido, expirado ou já usado.
        """
        token_hash = hashlib.sha256(data.token.encode()).hexdigest()
        record = self._repo.get_reset_token(token_hash)

        if not record:
            raise ValueError("Token inválido ou expirado.")

        # Verifica expiração manualmente (camada extra além do banco)
        expires_at = datetime.fromisoformat(record["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            raise ValueError("Token inválido ou expirado.")

        # Invalida antes de atualizar — evita race condition
        self._repo.invalidate_reset_token(record["id"])

        new_hash = hash_password(data.new_password)
        self._repo.update_password(record["user_id"], new_hash)

        logger.info("Senha redefinida: user_id=%s", record["user_id"])