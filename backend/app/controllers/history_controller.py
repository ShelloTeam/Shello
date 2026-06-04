from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.models.history_models import HistoryResponse
from app.services.history_service import HistoryService
from app.repositories.history_repository import HistoryRepository
from app.core.dependencies import get_current_user, get_supabase, User

router = APIRouter(prefix="/api/history", tags=["Histórico"])


def get_history_service(db=Depends(get_supabase)) -> HistoryService:
    return HistoryService(repository=HistoryRepository(db=db))


@router.get(
    "",
    response_model=HistoryResponse,
    summary="Histórico unificado de conversas e anotações",
    description="""
Retorna histórico unificado com conversas e anotações do diário.

**Filtros:**
- `?type=conversation` — apenas conversas
- `?type=diary` — apenas anotações
- `?q=palavra` — busca por palavra-chave no conteúdo

**Ordenação:** created_at DESC (mais recente primeiro)

**Autenticação:** Bearer token JWT obrigatório
""",
    responses={401: {"description": "Token JWT ausente ou inválido"}},
)
async def list_history(
    type: Optional[str] = Query(default=None, description="Filtro por tipo: 'conversation' ou 'diary'"),
    q: Optional[str] = Query(default=None, description="Busca por palavra-chave"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: HistoryService = Depends(get_history_service),
):
    return await service.list_unified(
        user_id=current_user.id,
        type_filter=type,
        query=q,
        page=page,
        page_size=page_size,
    )
