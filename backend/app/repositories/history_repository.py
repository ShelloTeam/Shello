from __future__ import annotations
from typing import Any, Optional
from app.models.history_models import HistoryItem


class HistoryRepository:
    """Queries ao Supabase para histórico unificado de conversas e diário."""

    def __init__(self, db: Any):
        self.db = db

    async def list_conversations(self, user_id: str, page: int = 1, page_size: int = 20) -> list[HistoryItem]:
        result = (
            self.db.table("conversations")
            .select("id,created_at,message_count")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range((page - 1) * page_size, page * page_size - 1)
            .execute()
        )
        return [
            HistoryItem(
                id=row["id"],
                type="conversation",
                preview="Conversa",
                created_at=row["created_at"],
                item_count=row.get("message_count", 0),
            )
            for row in (result.data or [])
        ]

    async def list_diary_entries(self, user_id: str, page: int = 1, page_size: int = 20) -> list[HistoryItem]:
        result = (
            self.db.table("diary_entries")
            .select("id,content,created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range((page - 1) * page_size, page * page_size - 1)
            .execute()
        )
        return [
            HistoryItem(
                id=row["id"],
                type="diary",
                preview=row["content"][:120],
                created_at=row["created_at"],
                item_count=len(row["content"].split()),
            )
            for row in (result.data or [])
        ]

    async def search_conversations(self, user_id: str, query: str) -> list[HistoryItem]:
        return []

    async def search_diary_entries(self, user_id: str, query: str) -> list[HistoryItem]:
        result = (
            self.db.table("diary_entries")
            .select("id,content,created_at")
            .eq("user_id", user_id)
            .ilike("content", f"%{query}%")
            .execute()
        )
        return [
            HistoryItem(
                id=row["id"],
                type="diary",
                preview=row["content"][:120],
                created_at=row["created_at"],
                item_count=len(row["content"].split()),
            )
            for row in (result.data or [])
        ]
