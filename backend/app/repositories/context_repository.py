from __future__ import annotations
from typing import Any


class ContextRepository:
    """Queries ao Supabase para context_fragments."""

    def __init__(self, db: Any):
        self.db = db

    async def get_active_fragments(self, user_id: str, limit: int = 20) -> list[dict]:
        result = (
            self.db.table("context_fragments")
            .select("content,category")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return result.data or []

    async def save(self, user_id: str, content: str, category: str, is_active: bool = False) -> None:
        self.db.table("context_fragments").insert({
            "user_id": user_id,
            "content": content,
            "category": category,
            "is_active": is_active,
        }).execute()

    async def delete(self, fragment_id: str) -> None:
        self.db.table("context_fragments").delete().eq("id", fragment_id).execute()
