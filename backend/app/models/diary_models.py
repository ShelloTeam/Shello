from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DiaryEntryCreate(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Conteúdo da anotação em texto plano.",
        json_schema_extra={"example": "Hoje finalizei o módulo de autenticação."},
    )


class DiaryEntryUpdate(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Novo conteúdo da anotação.",
        json_schema_extra={"example": "Texto atualizado."},
    )


class DiaryEntry(BaseModel):
    id: str
    user_id: str
    content: str
    created_at: str
    updated_at: str
    date_group: Optional[str] = None

    model_config = {"from_attributes": True}


class DiaryListResponse(BaseModel):
    items: list[DiaryEntry]
    total: int
    page: int
    page_size: int
