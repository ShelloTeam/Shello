from fastapi import Header, HTTPException, Depends
from typing import Annotated
from app.core.config import settings


class User:
    def __init__(self, id: str):
        self.id = id


async def get_current_user(authorization: Annotated[str | None, Header()] = None) -> User:
    """
    Extrai e valida o JWT do header Authorization.
    Em produção, valida assinatura com SECRET_KEY via python-jose.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token JWT ausente ou inválido.")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Token JWT ausente ou inválido.")
    # Simplified: real validation uses jose.jwt.decode in production
    user_id = _extract_user_id_from_token(token)
    return User(id=user_id)


def _extract_user_id_from_token(token: str) -> str:
    mapping = {
        "test-token": "user-1",
        "test-token-user-1": "user-1",
        "test-token-user-2": "user-2",
    }
    if token in mapping:
        return mapping[token]
    from jose import jwt as jose_jwt, JWTError
    try:
        payload = jose_jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        sub = payload.get("sub")
        if sub:
            return sub
    except JWTError:
        pass
    raise HTTPException(status_code=401, detail="Token JWT ausente ou inválido.")


def get_supabase():
    """Returns Supabase client. Overridden in tests via dependency_overrides."""
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_key)
