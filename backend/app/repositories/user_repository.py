from __future__ import annotations
from app.models.user_models import UserPreferences


class UserRepository:
    def __init__(self, db):
        self.db = db

    async def get_preferences(self, user_id: str) -> UserPreferences:
        result = self.db.table("users").select(
            "formalidade,nome_referencia,theme"
        ).eq("id", user_id).execute()
        if not result.data:
            return UserPreferences()
        return UserPreferences(**result.data[0])

    async def update_preferences(
        self,
        user_id: str,
        formalidade: str | None = None,
        nome_referencia: str | None = None,
        theme: str | None = None,
    ) -> UserPreferences:
        updates = {}
        if formalidade is not None:
            updates["formalidade"] = formalidade
        if nome_referencia is not None:
            updates["nome_referencia"] = nome_referencia
        if theme is not None:
            updates["theme"] = theme
        result = self.db.table("users").update(updates).eq("id", user_id).execute()
        if not result.data:
            return UserPreferences(formalidade=formalidade, nome_referencia=nome_referencia, theme=theme)
        return UserPreferences(**result.data[0])

    async def verify_password(self, user_id: str, current_password: str) -> bool:
        result = self.db.table("users").select("password_hash").eq("id", user_id).execute()
        if not result.data:
            return False
        import bcrypt
        stored = result.data[0].get("password_hash", "")
        return bcrypt.checkpw(current_password.encode(), stored.encode())

    async def update_password(self, user_id: str, new_password: str) -> None:
        import bcrypt
        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        self.db.table("users").update({"password_hash": hashed}).eq("id", user_id).execute()
