from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.models.user_models import UserPreferences, UserPreferencesUpdate, PasswordChange, PasswordChangeResponse
from app.services.user_service import UserService
from app.repositories.user_repository import UserRepository
from app.core.dependencies import get_current_user, User


class UserInfo(BaseModel):
    user_id: str
    nome: str
    email: str
    nome_referencia: str | None = None

router = APIRouter(prefix="/api/users", tags=["Configurações"])


def get_user_service() -> UserService:
    return UserService(repository=UserRepository())


@router.get("/me", response_model=UserInfo, summary="Dados do usuário autenticado")
async def get_me(
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    repo = UserRepository()
    user = repo.get_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return UserInfo(
        user_id=user["id"],
        nome=user.get("name") or "",
        email=user.get("email") or "",
        nome_referencia=user.get("nome_referencia"),
    )


@router.get(
    "/preferences",
    response_model=UserPreferences,
    summary="Buscar preferências do usuário",
)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return await service.get_preferences(user_id=current_user.id)


@router.put(
    "/preferences",
    response_model=UserPreferences,
    summary="Atualizar preferências do agente",
    description="""
Atualiza formalidade, nome de referência e/ou tema visual do usuário.

**Campos:**
- `formalidade`: `"baixa"`, `"media"` ou `"alta"` — afeta tom do agente
- `nome_referencia`: como o agente chama o usuário (máx 30 chars)
- `theme`: `"light"` ou `"dark"` — sincronizado entre dispositivos

**Autenticação:** Bearer token JWT obrigatório
""",
    responses={
        401: {"description": "Token JWT ausente ou inválido"},
        422: {"description": "Formalidade inválida ou nome_referencia > 30 chars"},
    },
)
async def update_preferences(
    body: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return await service.update_preferences(
        user_id=current_user.id,
        formalidade=body.formalidade,
        nome_referencia=body.nome_referencia,
        theme=body.theme,
    )


@router.put(
    "/password",
    response_model=PasswordChangeResponse,
    summary="Alterar senha",
    description="""
Altera a senha do usuário autenticado.

**Regras:**
- `current_password`: deve ser a senha atual válida
- `new_password`: mínimo 8 caracteres

**Autenticação:** Bearer token JWT obrigatório
""",
    responses={
        401: {"description": "Senha atual incorreta ou token JWT inválido"},
        422: {"description": "Nova senha muito curta (< 8 chars)"},
    },
)
async def change_password(
    body: PasswordChange,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    try:
        await service.change_password(
            user_id=current_user.id,
            current_password=body.current_password,
            new_password=body.new_password,
        )
    except PermissionError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return PasswordChangeResponse(message="Senha alterada com sucesso.")
