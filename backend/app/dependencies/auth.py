from fastapi import Cookie, HTTPException, status, Depends
from app.core.security import decode_access_token
from app.schemas.auth import TokenData
from app.repositories.onboarding_repository import OnboardingRepository


def get_current_user(
    access_token: str | None = Cookie(default=None),
) -> TokenData:
    """
    Dependência reutilizável para rotas protegidas.
    Extrai e valida o JWT do cookie HTTPOnly.
    Retorna 401 para token ausente, expirado ou inválido.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if access_token is None:
        raise credentials_exception

    payload = decode_access_token(access_token)
    if payload is None:
        raise credentials_exception

    subject: str = payload.get("sub")
    if subject is None:
        raise credentials_exception

    return TokenData(sub=subject)


def require_onboarding_done(user: TokenData = Depends(get_current_user)) -> TokenData:
    repo = OnboardingRepository()
    user_data = repo.get_user(user.sub)
    if not user_data or not user_data.get("onboarding_done"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Onboarding pendente. Complete o onboarding primeiro."
        )
    return user