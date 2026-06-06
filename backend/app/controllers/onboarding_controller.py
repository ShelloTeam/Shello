from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator

from app.services.onboarding_service import OnboardingService
from app.repositories.onboarding_repository import OnboardingRepository
from app.core.dependencies import get_current_user, User

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])

MAX_LEN = 100


class OnboardingMobile(BaseModel):
    nome: str
    estiloDeVida: str
    metaAtual: str

    @field_validator("nome", "estiloDeVida", "metaAtual")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Campo obrigatório.")
        return v.strip()[:MAX_LEN]


def get_onboarding_service() -> OnboardingService:
    return OnboardingService(repo=OnboardingRepository())


@router.post("/complete", status_code=201, summary="Concluir onboarding (Bearer auth)")
async def complete_onboarding(
    body: OnboardingMobile,
    current_user: User = Depends(get_current_user),
    service: OnboardingService = Depends(get_onboarding_service),
):
    from app.schemas.onboarding import OnboardingSubmit
    data = OnboardingSubmit(
        q1_name=body.nome,
        q2_lifestyle=body.estiloDeVida,
        q3_goal=body.metaAtual,
    )
    try:
        service.complete_onboarding(current_user.id, data)
    except ValueError as e:
        if "já foi concluído" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": "Onboarding concluído com sucesso."}
