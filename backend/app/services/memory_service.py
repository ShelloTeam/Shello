from __future__ import annotations
from app.models.memory_models import Memory
from app.repositories.context_fragment_repository import ContextFragmentRepository

MEMORY_CATEGORIES = {"PREFERENCIA", "FATO", "OBJETIVO"}


class MemoryService:
    def __init__(self, repository: ContextFragmentRepository) -> None:
        self.repository = repository

    async def list(self, user_id: str) -> list[Memory]:
        rows = self.repository.list_active(user_id=user_id)
        return [
            Memory.from_fragment(row)
            for row in rows
            if row.get("category") in MEMORY_CATEGORIES
        ]

    async def create(self, user_id: str, content: str, tipo: str) -> Memory:
        row = self.repository.create(
            user_id=user_id,
            content=content,
            category=tipo,
        )
        return Memory.from_fragment(row)

    async def delete(self, memory_id: str, user_id: str) -> bool:
        deleted = self.repository.delete(fragment_id=memory_id, user_id=user_id)
        if not deleted:
            raise KeyError(f"Memória {memory_id} não encontrada.")
        return True
