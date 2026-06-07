from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Literal


class MemoryCreate(BaseModel):
    conteudo: str = Field(..., min_length=1, max_length=500)
    tipo: Literal["PREFERENCIA", "FATO", "OBJETIVO"]


class Memory(BaseModel):
    id: str
    user_id: str
    conteudo: str
    tipo: str
    created_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_fragment(cls, row: dict) -> "Memory":
        return cls(
            id=row["id"],
            user_id=row["user_id"],
            conteudo=row["content"],
            tipo=row["category"],
            created_at=row["created_at"],
        )
