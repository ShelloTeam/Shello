import logging

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import RedirectResponse, JSONResponse

from app.core.config import get_settings
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.schemas.auth import UserCreate, UserLogin, PasswordResetRequest, PasswordResetConfirm

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 dias


def get_auth_service() -> AuthService:
    repo = UserRepository()
    return AuthService(repo=repo)


def _set_auth_cookie(response, token: str, is_production: bool) -> None:
    """Centraliza a criação do cookie — evita duplicação entre login e register."""
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


@router.post("/register", status_code=status.HTTP_303_SEE_OTHER)
async def register(
    user_data: UserCreate,
    service: AuthService = Depends(get_auth_service),
):
    settings = get_settings()
    try:
        token = service.register_user(user_data)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não foi possível realizar o cadastro. Verifique os dados enviados.",
        )
    except Exception:
        logger.exception("Erro inesperado no cadastro")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")

    response = RedirectResponse(url="/onboarding", status_code=status.HTTP_303_SEE_OTHER)
    _set_auth_cookie(response, token, settings.is_production)
    return response


@router.post("/login", status_code=status.HTTP_303_SEE_OTHER)
async def login(
    credentials: UserLogin,
    service: AuthService = Depends(get_auth_service),
):
    """
    Autentica usuário, define cookie JWT HTTPOnly e redireciona para dashboard.
    Mensagem genérica — não revela qual campo está errado.
    """
    settings = get_settings()
    try:
        token = service.login_user(credentials)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
        )
    except Exception:
        logger.exception("Erro inesperado no login")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")

    response = RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    _set_auth_cookie(response, token, settings.is_production)
    return response


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout do usuário",
    description="Realiza logout limpando o cookie JWT.",
)
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=False,
        httponly=True,
        samesite="lax",
    )
    return {"message": "Logout realizado."}


@router.post("/password-reset/request", status_code=status.HTTP_200_OK)
async def request_password_reset(
    data: PasswordResetRequest,
    service: AuthService = Depends(get_auth_service),
):
    """
    Etapa 1: recebe e-mail e gera token.
    Resposta SEMPRE idêntica — não revela se e-mail está cadastrado.

    Em produção: integrar com serviço de e-mail (SendGrid, Resend etc.)
    O token retornado aqui é apenas para desenvolvimento/testes.
    """
    try:
        raw_token = service.request_password_reset(data)
    except Exception:
        logger.exception("Erro no request de reset")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")

    # Resposta genérica independente de o e-mail existir ou não
    response_body = {
        "message": "Se o e-mail estiver cadastrado, você receberá um link em breve."
    }

    # Em desenvolvimento, expõe o token para facilitar testes
    # NUNCA expor em produção
    settings = get_settings()
    if not settings.is_production and raw_token:
        response_body["dev_token"] = raw_token

    return JSONResponse(content=response_body)


@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
async def confirm_password_reset(
    data: PasswordResetConfirm,
    service: AuthService = Depends(get_auth_service),
):
    """
    Etapa 2: recebe token + nova senha e atualiza.
    Token invalidado após primeiro uso.
    """
    try:
        service.reset_password(data)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado.",
        )
    except Exception:
        logger.exception("Erro no confirm de reset")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")

    return JSONResponse(content={"message": "Senha redefinida com sucesso."})