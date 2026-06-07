from __future__ import annotations
from typing import Any, Optional
from datetime import datetime
from app.models.chat_models import Conversation


class ChatRepository:
    """Queries ao Supabase para conversas e mensagens."""

    def __init__(self, db: Any):
        self.db = db

    async def get_active_conversation(self, user_id: str) -> Optional[Conversation]:
        result = (
            self.db.table("conversations")
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "active")
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return Conversation(**result.data[0])

    async def create_conversation(self, user_id: str) -> Conversation:
        result = (
            self.db.table("conversations")
            .insert({"user_id": user_id, "message_count": 0, "status": "active"})
            .execute()
        )
        return Conversation(**result.data[0])

    async def save_message(self, conversation_id: str, role: str, content: str, user_id: str = "") -> None:
        row = {"conversation_id": conversation_id, "role": role, "content": content}
        if user_id:
            row["user_id"] = user_id
        self.db.table("messages").insert(row).execute()

    async def increment_message_count(self, conversation_id: str) -> None:
        current = (
            self.db.table("conversations")
            .select("message_count")
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        new_count = (current.data.get("message_count") or 0) + 2
        self.db.table("conversations").update({"message_count": new_count}).eq("id", conversation_id).execute()

    async def get_history(self, conversation_id: str, limit: int = 20) -> list[dict]:
        result = (
            self.db.table("messages")
            .select("role,content")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return [{"role": r["role"], "content": r["content"]} for r in result.data]

    async def archive_before(self, cutoff: datetime) -> None:
        self.db.table("conversations").update({"status": "archived"}).lt(
            "updated_at", cutoff.isoformat()
        ).execute()
