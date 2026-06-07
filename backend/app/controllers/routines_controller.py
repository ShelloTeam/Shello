from fastapi import APIRouter, Depends, HTTPException
from app.models.routine_models import Routine, RoutineCreate, RoutineUpdate
from app.services.routine_service import RoutineService
from app.repositories.routine_repository import RoutineRepository
from app.core.dependencies import get_current_user, User

router = APIRouter(prefix="/api/routines", tags=["Rotinas"])


def get_routine_service() -> RoutineService:
    return RoutineService(repository=RoutineRepository())


@router.get("", response_model=list[Routine], summary="Listar rotinas do usuário")
async def list_routines(
    current_user: User = Depends(get_current_user),
    service: RoutineService = Depends(get_routine_service),
):
    return await service.list(user_id=current_user.id)


@router.post("", response_model=Routine, status_code=201, summary="Criar nova rotina")
async def create_routine(
    body: RoutineCreate,
    current_user: User = Depends(get_current_user),
    service: RoutineService = Depends(get_routine_service),
):
    return await service.create(
        user_id=current_user.id,
        nome=body.nome,
        atividades=body.atividades,
        periodo=body.periodo,
    )


@router.put("/{routine_id}", response_model=Routine, summary="Atualizar rotina")
async def update_routine(
    routine_id: str,
    body: RoutineUpdate,
    current_user: User = Depends(get_current_user),
    service: RoutineService = Depends(get_routine_service),
):
    try:
        return await service.update(
            routine_id=routine_id,
            user_id=current_user.id,
            nome=body.nome,
            atividades=body.atividades,
            periodo=body.periodo,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{routine_id}", status_code=204, summary="Deletar rotina")
async def delete_routine(
    routine_id: str,
    current_user: User = Depends(get_current_user),
    service: RoutineService = Depends(get_routine_service),
):
    try:
        await service.delete(routine_id=routine_id, user_id=current_user.id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
