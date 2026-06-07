from __future__ import annotations
from app.models.user_models import UserPreferences
from app.repositories.user_repository import UserRepository
from app.core.security import hash_password


class UserService:
    """
    Lógica de negócio para preferências do usuário e troca de senha.

    Attributes:
        repository: UserRepository para acesso ao banco.
    """

    def __init__(self, repository: UserRepository):
        self.repository = repository

    async def get_preferences(self, user_id: str) -> UserPreferences:
        return await self.repository.get_preferences(user_id=user_id)

    async def update_preferences(
        self,
        user_id: str,
        formalidade: str | None = None,
        nome_referencia: str | None = None,
        theme: str | None = None,
    ) -> UserPreferences:
        return await self.repository.update_preferences(
            user_id=user_id,
            formalidade=formalidade,
            nome_referencia=nome_referencia,
            theme=theme,
        )

    async def change_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str,
    ) -> None:
        valid = await self.repository.verify_password(user_id=user_id, current_password=current_password)
        if not valid:
            raise PermissionError("Senha atual incorreta.")
        hashed = hash_password(new_password)
        self.repository.update_password(user_id=user_id, hashed_password=hashed)
