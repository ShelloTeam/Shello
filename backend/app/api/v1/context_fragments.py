import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.repositories.context_fragment_repository import ContextFragmentRepository
from app.services.context_fragment_service import ContextFragmentService, LimitError
from app.schemas.context_fragments import ContextFragmentCreate, ContextFragmentPatch
from app.dependencies.auth import get_current_user, require_onboarding_done
from app.schemas.auth import TokenData

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/context", tags=["context_fragments"])


def get_fragment_service() -> ContextFragmentService:
    return ContextFragmentService(repo=ContextFragmentRepository())


@router.get("", status_code=status.HTTP_200_OK)
async def list_fragments(
    current_user: TokenData = Depends(require_onboarding_done),
    service: ContextFragmentService = Depends(get_fragment_service),
):
    """Lista fragmentos ativos (is_active=true) do usuário autenticado."""
    try:
        fragments = service.list_active(current_user.sub)
        return JSONResponse(content={
            "fragments": fragments,
            "total": len(fragments),
        })
    except Exception:
        logger.exception("Erro ao listar fragmentos")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_fragment(
    data: ContextFragmentCreate,
    current_user: TokenData = Depends(require_onboarding_done),
    service: ContextFragmentService = Depends(get_fragment_service),
):
    """
    Cria fragmento manualmente.
    Bloqueado com 422 se limite de 20 ativos for atingido.
    """
    try:
        fragment = service.create_fragment(current_user.sub, data)
        return JSONResponse(content=fragment, status_code=status.HTTP_201_CREATED)
    except LimitError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception:
        logger.exception("Erro ao criar fragmento")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")


@router.patch("/{fragment_id}", status_code=status.HTTP_200_OK)
async def patch_fragment(
    fragment_id: str,
    data: ContextFragmentPatch,
    current_user: TokenData = Depends(require_onboarding_done),
    service: ContextFragmentService = Depends(get_fragment_service),
):
    """
    Atualiza is_active do fragmento.
    Acesso cross-user retorna 403 via RLS + filtro de ownership no repositório.
    Reativar fragmento quando limite atingido retorna 422.
    """
    try:
        fragment = service.patch_fragment(fragment_id, current_user.sub, data)
        return JSONResponse(content=fragment)
    except LimitError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fragmento não encontrado.",
        )
    except Exception:
        logger.exception("Erro ao atualizar fragmento")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")


@router.delete("/{fragment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fragment(
    fragment_id: str,
    current_user: TokenData = Depends(require_onboarding_done),
    service: ContextFragmentService = Depends(get_fragment_service),
):
    """
    Exclusão permanente do fragmento.
    Fragmentos com derived_from_conversation_id deletado persistem normalmente
    — a FK usa ON DELETE SET NULL, então o fragmento não é removido em cascata.
    """
    try:
        service.delete_fragment(fragment_id, current_user.sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fragmento não encontrado.",
        )
    except Exception:
        logger.exception("Erro ao deletar fragmento")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")