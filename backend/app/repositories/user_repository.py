import logging
from supabase import create_client, Client
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class UserRepository:
    def __init__(self) -> None:
        self._client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key,
        )

    def email_exists(self, email: str) -> bool:
        try:
            result = (
                self._client.table("users")
                .select("id")
                .eq("email", email)
                .limit(1)
                .execute()
            )
            return len(result.data) > 0
        except Exception:
            logger.error("Erro ao verificar existência de e-mail")
            raise

    def create_user(self, email: str, hashed_password: str, nome: str) -> dict:
        try:
            result = (
                self._client.table("users")
                .insert({"email": email, "password_hash": hashed_password, "nome_referencia": nome})
                .execute()
            )
            if not result.data:
                raise RuntimeError("Inserção retornou dados vazios.")
            logger.info("Usuário criado: id=%s", result.data[0].get("id"))
            return result.data[0]
        except Exception:
            logger.error("Erro ao criar usuário")
            raise

    # ── NOVO ──────────────────────────────────────────────────────────────

    def get_by_email(self, email: str) -> dict | None:
        """Retorna o usuário completo (incluindo password_hash) ou None."""
        try:
            result = (
                self._client.table("users")
                .select("id, email, password_hash")
                .eq("email", email)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception:
            logger.error("Erro ao buscar usuário por e-mail")
            raise

    def save_reset_token(self, user_id: str, token_hash: str, expires_at: str) -> None:
        """
        Salva token de recuperação hasheado na tabela password_reset_tokens.
        Armazena o HASH do token, nunca o token em texto claro.
        """
        try:
            self._client.table("password_reset_tokens").insert({
                "user_id": user_id,
                "token_hash": token_hash,
                "expires_at": expires_at,
                "used": False,
            }).execute()
        except Exception:
            logger.error("Erro ao salvar token de recuperação")
            raise

    def get_reset_token(self, token_hash: str) -> dict | None:
        """Busca token válido (não usado e não expirado)."""
        try:
            result = (
                self._client.table("password_reset_tokens")
                .select("id, user_id, expires_at, used")
                .eq("token_hash", token_hash)
                .eq("used", False)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception:
            logger.error("Erro ao buscar token de recuperação")
            raise

    def invalidate_reset_token(self, token_id: str) -> None:
        """Marca token como usado — invalida após primeiro uso."""
        try:
            self._client.table("password_reset_tokens").update(
                {"used": True}
            ).eq("id", token_id).execute()
        except Exception:
            logger.error("Erro ao invalidar token de recuperação")
            raise

    def update_password(self, user_id: str, hashed_password: str) -> None:
        """Atualiza o hash da senha do usuário."""
        try:
            self._client.table("users").update(
                {"password_hash": hashed_password}
            ).eq("id", user_id).execute()
        except Exception:
            logger.error("Erro ao atualizar senha")
            raise