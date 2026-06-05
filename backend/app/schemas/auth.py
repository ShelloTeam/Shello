import re
from pydantic import BaseModel, EmailStr, field_validator

PASSWORD_MIN_LENGTH = 8
PASSWORD_PATTERN = re.compile(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$'
)


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nome: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < PASSWORD_MIN_LENGTH:
            raise ValueError("Dados inválidos.")
        if not PASSWORD_PATTERN.match(value):
            raise ValueError("Dados inválidos.")
        return value

    class Config:
        json_schema_extra = {
            "example": {
                "email": "usuario@exemplo.com",
                "password": "Senha@Forte1",
                "nome": "João Silva"
            }
        }


class TokenData(BaseModel):
    sub: str


# ── NOVO ──────────────────────────────────────────────────────────────────────

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    """Etapa 1: usuário informa o e-mail."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Etapa 2: usuário informa o token (via link) e a nova senha."""
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < PASSWORD_MIN_LENGTH:
            raise ValueError("Dados inválidos.")
        if not PASSWORD_PATTERN.match(value):
            raise ValueError("Dados inválidos.")
        return value