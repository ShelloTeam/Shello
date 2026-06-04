from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Título da tarefa.")
    due_date: Optional[date] = Field(None, description="Data de vencimento. Sempre null quando criada via chat.")


class TaskFromChatSingle(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class TaskFromChatBatch(BaseModel):
    tasks: list[TaskFromChatSingle] = Field(..., min_length=1, max_length=3)


class Task(BaseModel):
    id: str
    user_id: str
    title: str
    status: str = "pending"
    due_date: Optional[date] = None

    model_config = {"from_attributes": True}


class TaskBatchResponse(BaseModel):
    created: list[Task]
