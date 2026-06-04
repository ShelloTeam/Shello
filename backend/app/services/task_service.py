from __future__ import annotations
from app.models.task_models import Task
from app.repositories.task_repository import TaskRepository


class TaskService:
    def __init__(self, repository: TaskRepository):
        self.repository = repository

    async def create(self, user_id: str, title: str) -> Task:
        if not title.strip():
            raise ValueError("Título não pode ser vazio.")
        return await self.repository.create(user_id=user_id, title=title)
