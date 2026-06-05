from typing import Optional
from pydantic import BaseModel, field_validator


VALID_CATEGORIES = {"preferencia", "fato", "objetivo", "restricao"}
MAX_CONTENT_LENGTH = 500
ACTIVE_FRAGMENTS_LIMIT = 20


class ContextFragmentCreate(BaseModel):
    content: str
    category: str
    derived_from_conversation_id: Optional[str] = None

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Conteúdo não pode ser vazio.")
        return value.strip()[:MAX_CONTENT_LENGTH]

    @field_validator("category")
    @classmethod
    def category_valid(cls, value: str) -> str:
        if value not in VALID_CATEGORIES:
            raise ValueError(f"Categoria deve ser uma de: {VALID_CATEGORIES}")
        return value


class ContextFragmentPatch(BaseModel):
    is_active: bool


class ContextFragmentResponse(BaseModel):
    id: str
    user_id: str
    content: str
    category: str
    is_active: bool
    derived_from_conversation_id: Optional[str]
    created_at: str