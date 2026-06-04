from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.diary_models import DiaryEntry, DiaryEntryCreate, DiaryEntryUpdate, DiaryListResponse
from app.services.diary_service import DiaryService
from app.repositories.diary_repository import DiaryRepository
from app.services.extraction_service import ExtractionService
from app.core.dependencies import get_current_user, get_supabase, User

router = APIRouter(prefix="/api/diary", tags=["Diário"])


def get_diary_service(db=Depends(get_supabase)) -> DiaryService:
    repo = DiaryRepository(db=db)
    extraction = ExtractionService()
    return DiaryService(repository=repo, extraction_service=extraction)


@router.post(
    "",
    response_model=DiaryEntry,
    status_code=201,
    summary="Criar nova anotação no diário",
    description="""
Cria uma nova anotação de texto plano no diário do usuário autenticado.

**Regras de negócio:**
- Conteúdo vazio ou apenas espaços é rejeitado (422)
- Conteúdo com mais de 100 caracteres dispara extração assíncrona de contexto
- Máximo de 10.000 caracteres por anotação

**Autenticação:** Bearer token JWT obrigatório no header `Authorization`
""",
    responses={
        401: {"description": "Token JWT ausente ou inválido"},
        422: {"description": "Conteúdo inválido ou vazio"},
    },
)
async def create_entry(
    body: DiaryEntryCreate,
    current_user: User = Depends(get_current_user),
    service: DiaryService = Depends(get_diary_service),
):
    """Cria nova anotação. Toda lógica está no DiaryService."""
    try:
        return await service.create(user_id=current_user.id, content=body.content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get(
    "",
    response_model=DiaryListResponse,
    summary="Listar anotações paginadas",
    description="Retorna anotações do usuário autenticado, agrupadas por dia, ordenadas por data decrescente.",
    responses={401: {"description": "Token JWT ausente ou inválido"}},
)
async def list_entries(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: DiaryService = Depends(get_diary_service),
):
    items = await service.list(user_id=current_user.id, page=page, page_size=page_size)
    return DiaryListResponse(items=items, total=len(items), page=page, page_size=page_size)


@router.get(
    "/search",
    response_model=DiaryListResponse,
    summary="Buscar anotações por palavra-chave",
    description="Busca anotações usando ILIKE no conteúdo.",
    responses={401: {"description": "Token JWT ausente ou inválido"}},
)
async def search_entries(
    q: str = Query(..., min_length=1, description="Termo de busca"),
    current_user: User = Depends(get_current_user),
    service: DiaryService = Depends(get_diary_service),
):
    items = await service.search(user_id=current_user.id, query=q)
    return DiaryListResponse(items=items, total=len(items), page=1, page_size=len(items))


@router.put(
    "/{entry_id}",
    response_model=DiaryEntry,
    summary="Editar anotação",
    responses={
        401: {"description": "Token JWT ausente ou inválido"},
        403: {"description": "Anotação pertence a outro usuário"},
        404: {"description": "Anotação não encontrada"},
    },
)
async def update_entry(
    entry_id: str,
    body: DiaryEntryUpdate,
    current_user: User = Depends(get_current_user),
    service: DiaryService = Depends(get_diary_service),
):
    try:
        return await service.update(entry_id=entry_id, current_user_id=current_user.id, content=body.content)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete(
    "/{entry_id}",
    status_code=204,
    summary="Excluir anotação",
    responses={
        401: {"description": "Token JWT ausente ou inválido"},
        403: {"description": "Anotação pertence a outro usuário"},
    },
)
async def delete_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    service: DiaryService = Depends(get_diary_service),
):
    try:
        await service.delete(entry_id=entry_id, current_user_id=current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
