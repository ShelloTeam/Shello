from datetime import date
from typing import Optional
from pydantic import BaseModel, field_validator


VALID_STATUSES = {"pending", "done"}


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Título não pode ser vazio.")
        return value.strip()

    @field_validator("description")
    @classmethod
    def description_strip(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            return value.strip() or None
        return None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("Título não pode ser vazio.")
        return value.strip() if value else value

    @field_validator("status")
    @classmethod
    def status_valid(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in VALID_STATUSES:
            raise ValueError(f"Status deve ser um de: {VALID_STATUSES}")
        return value


class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    due_date: Optional[date]
    status: str
    is_overdue: bool
    created_at: str
    updated_at: str

class TaskStatusToggle(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_valid(cls, value: str) -> str:
        if value not in VALID_STATUSES:
            raise ValueError(f"Status deve ser um de: {VALID_STATUSES}")
        return value