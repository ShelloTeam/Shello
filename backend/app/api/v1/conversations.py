import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.jobs.conversation_archiver import archive_inactive_conversations
from app.dependencies.auth import get_current_user
from app.schemas.auth import TokenData

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/conversations", tags=["conversations"])


@router.post("/archive-inactive", status_code=status.HTTP_200_OK)
async def trigger_archive(
    current_user: TokenData = Depends(get_current_user),
):
    """
    Aciona manualmente o job de arquivamento.
    Útil para testes e operações — em produção o scheduler já roda a cada 15min.
    """
    try:
        count = archive_inactive_conversations()
        return JSONResponse(content={
            "archived": count,
            "message": f"{count} conversa(s) arquivada(s).",
        })
    except Exception:
        logger.exception("Erro ao acionar arquivamento manual")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")