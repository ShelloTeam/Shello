from __future__ import annotations
from app.models.task_models import Task


class TaskRepository:
    def __init__(self, db):
        self.db = db

    async def create(self, user_id: str, title: str) -> Task:
        result = self.db.table("tasks").insert({
            "user_id": user_id,
            "title": title,
            "status": "pending",
            "due_date": None,
        }).execute()
        return Task(**result.data[0])
