from fastapi import APIRouter, Depends, HTTPException
from app.models.memory_models import Memory, MemoryCreate
from app.services.memory_service import MemoryService
from app.repositories.context_fragment_repository import ContextFragmentRepository
from app.core.dependencies import get_current_user, User

router = APIRouter(prefix="/api/memories", tags=["Memórias IA"])


def get_memory_service() -> MemoryService:
    return MemoryService(repository=ContextFragmentRepository())


@router.get("", response_model=list[Memory], summary="Listar memórias do usuário")
async def list_memories(
    current_user: User = Depends(get_current_user),
    service: MemoryService = Depends(get_memory_service),
):
    return await service.list(user_id=current_user.id)


@router.post("", response_model=Memory, status_code=201, summary="Criar memória")
async def create_memory(
    body: MemoryCreate,
    current_user: User = Depends(get_current_user),
    service: MemoryService = Depends(get_memory_service),
):
    try:
        return await service.create(
            user_id=current_user.id,
            content=body.conteudo,
            tipo=body.tipo,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/{memory_id}", status_code=204, summary="Deletar memória")
async def delete_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    service: MemoryService = Depends(get_memory_service),
):
    try:
        await service.delete(memory_id=memory_id, user_id=current_user.id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
