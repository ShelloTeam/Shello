from typing import Any, Optional
from app.models.diary_models import DiaryEntry


class DiaryRepository:
    """
    Queries ao Supabase para a tabela diary_entries.

    Attributes:
        db: Supabase client injetado via dependência.
    """

    def __init__(self, db: Any):
        self.db = db

    async def create(self, user_id: str, content: str) -> DiaryEntry:
        """Insere anotação e retorna o registro."""
        result = (
            self.db.table("diary_entries")
            .insert({"user_id": user_id, "content": content})
            .execute()
        )
        return DiaryEntry(**result.data[0])

    async def get_by_id(self, entry_id: str) -> Optional[DiaryEntry]:
        """Busca anotação por ID."""
        result = (
            self.db.table("diary_entries")
            .select("*")
            .eq("id", entry_id)
            .execute()
        )
        if not result.data:
            return None
        return DiaryEntry(**result.data[0])

    async def list_by_user(self, user_id: str, page: int = 1, page_size: int = 20) -> list[DiaryEntry]:
        """Lista anotações paginadas de um usuário."""
        offset = (page - 1) * page_size
        result = (
            self.db.table("diary_entries")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        return [DiaryEntry(**row) for row in result.data]

    async def update(self, entry_id: str, content: str) -> DiaryEntry:
        """Atualiza conteúdo de uma anotação."""
        result = (
            self.db.table("diary_entries")
            .update({"content": content})
            .eq("id", entry_id)
            .execute()
        )
        return DiaryEntry(**result.data[0])

    async def delete(self, entry_id: str) -> None:
        """Remove anotação permanentemente."""
        self.db.table("diary_entries").delete().eq("id", entry_id).execute()

    async def search(self, user_id: str, query: str) -> list[DiaryEntry]:
        """Busca full-text via ILIKE."""
        result = (
            self.db.table("diary_entries")
            .select("*")
            .eq("user_id", user_id)
            .ilike("content", f"%{query}%")
            .execute()
        )
        return [DiaryEntry(**row) for row in result.data]

    async def count_by_user(self, user_id: str) -> int:
        """Conta total de anotações do usuário."""
        result = (
            self.db.table("diary_entries")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        return result.count or 0
