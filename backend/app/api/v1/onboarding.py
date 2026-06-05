import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.repositories.onboarding_repository import OnboardingRepository
from app.services.onboarding_service import OnboardingService
from app.schemas.onboarding import OnboardingSubmit
from app.dependencies.auth import get_current_user
from app.schemas.auth import TokenData

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/onboarding", tags=["onboarding"])


def get_onboarding_service() -> OnboardingService:
    repo = OnboardingRepository()
    return OnboardingService(repo=repo)


@router.get("/status")
async def onboarding_status(
    current_user: TokenData = Depends(get_current_user),
    service: OnboardingService = Depends(get_onboarding_service),
):
    """
    Retorna estado atual do onboarding.
    Frontend usa isso para retomar fluxo interrompido.
    Requer autenticação — retorna 401 sem token válido.
    """
    try:
        result = service.get_status(current_user.sub)
        return JSONResponse(content=result.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception:
        logger.exception("Erro ao buscar status de onboarding")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")


@router.post("/complete", status_code=status.HTTP_201_CREATED)
async def complete_onboarding(
    data: OnboardingSubmit,
    current_user: TokenData = Depends(get_current_user),
    service: OnboardingService = Depends(get_onboarding_service),
):
    """
    Recebe as 3 respostas e conclui o onboarding.
    - Respostas vazias rejeitadas (422)
    - Respostas truncadas em 100 chars
    - Onboarding já concluído retorna 409
    - Requer autenticação — retorna 401 sem token válido
    """
    try:
        service.complete_onboarding(current_user.sub, data)
    except ValueError as e:
        if "já foi concluído" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Onboarding já foi concluído.",
            )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception:
        logger.exception("Erro ao completar onboarding")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")

    return JSONResponse(
        content={"message": "Onboarding concluído com sucesso."},
        status_code=status.HTTP_201_CREATED,
    )