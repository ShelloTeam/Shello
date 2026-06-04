from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Literal


class UserPreferences(BaseModel):
    formalidade: Optional[Literal["baixa", "media", "alta"]] = None
    nome_referencia: Optional[str] = None
    theme: Optional[Literal["light", "dark"]] = None

    model_config = {"from_attributes": True}


class UserPreferencesUpdate(BaseModel):
    formalidade: Optional[Literal["baixa", "media", "alta"]] = Field(
        None,
        description="Nível de formalidade do agente.",
    )
    nome_referencia: Optional[str] = Field(
        None,
        max_length=30,
        description="Como o agente deve chamar o usuário.",
    )
    theme: Optional[Literal["light", "dark"]] = Field(
        None,
        description="Tema visual do aplicativo.",
    )


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1, description="Senha atual.")
    new_password: str = Field(..., min_length=8, description="Nova senha (mínimo 8 caracteres).")


class PasswordChangeResponse(BaseModel):
    message: str
