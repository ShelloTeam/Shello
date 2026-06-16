from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Literal


class RoutineCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    atividades: list[str] = Field(default_factory=list)
    periodo: Literal["manha", "tarde", "noite"]


class RoutineUpdate(BaseModel):
    nome: str | None = Field(None, min_length=1, max_length=100)
    atividades: list[str] | None = None
    periodo: Literal["manha", "tarde", "noite"] | None = None


class Routine(BaseModel):
    id: str
    user_id: str
    nome: str
    atividades: list[str]
    periodo: str
    created_at: str | None = None
    updated_at: str | None = None

    model_config = {"from_attributes": True}
