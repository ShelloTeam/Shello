from pydantic import BaseModel, field_validator


MAX_ANSWER_LENGTH = 100


class OnboardingSubmit(BaseModel):
    """Recebe as 3 respostas do onboarding de uma vez."""
    q1_name: str
    q2_lifestyle: str
    q3_goal: str

    @field_validator("q1_name", "q2_lifestyle", "q3_goal")
    @classmethod
    def not_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Resposta não pode ser vazia.")
        # Trunca em 100 chars antes de salvar
        return value.strip()[:MAX_ANSWER_LENGTH]


class OnboardingStatusResponse(BaseModel):
    """Retorna estado atual do onboarding para retomada de fluxo."""
    onboarding_done: bool
    q1_answered: bool
    q2_answered: bool
    q3_answered: bool