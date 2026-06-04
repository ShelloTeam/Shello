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
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return Conversation(**result.data[0])

    async def create_conversation(self, user_id: str) -> Conversation:
        result = (
            self.db.table("conversations")
            .insert({"user_id": user_id, "message_count": 0, "is_active": True})
            .execute()
        )
        return Conversation(**result.data[0])

    async def save_message(self, conversation_id: str, role: str, content: str) -> None:
        self.db.table("messages").insert({
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
        }).execute()

    async def increment_message_count(self, conversation_id: str) -> None:
        self.db.rpc("increment_message_count", {"conv_id": conversation_id}).execute()

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
        self.db.table("conversations").update({"is_active": False}).lt(
            "updated_at", cutoff.isoformat()
        ).execute()
