from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Union, Optional
from app.models.task_models import TaskFromChatSingle, TaskFromChatBatch, TaskBatchResponse
from app.schemas.tasks import TaskCreate, TaskUpdate, TaskResponse
from app.services.task_service import TaskService
from app.repositories.task_repository import TaskRepository
from app.core.dependencies import get_current_user, User

router = APIRouter(prefix="/api/tasks", tags=["Tarefas"])


def get_task_service() -> TaskService:
    return TaskService(repo=TaskRepository())


@router.get("", response_model=list[TaskResponse], summary="Listar tarefas do usuário")
async def list_tasks(
    status: Optional[str] = Query(None, description="Filtrar por status: pending | done"),
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    return service.list_tasks(user_id=current_user.id, status=status)


@router.post("", response_model=TaskResponse, status_code=201, summary="Criar nova tarefa")
async def create_task(
    body: TaskCreate,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    try:
        return service.create_task(user_id=current_user.id, data=body)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.patch("/{task_id}", response_model=TaskResponse, summary="Atualizar tarefa")
async def update_task(
    task_id: str,
    body: TaskUpdate,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    try:
        return service.update_task(task_id=task_id, user_id=current_user.id, data=body)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{task_id}", status_code=204, summary="Deletar tarefa")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    try:
        service.delete_task(task_id=task_id, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/from-chat",
    status_code=201,
    summary="Criar tarefa(s) confirmada(s) via chat",
    responses={
        401: {"description": "Token JWT ausente ou inválido"},
        422: {"description": "Título vazio ou mais de 3 tarefas"},
    },
)
async def create_task_from_chat(
    body: Union[TaskFromChatSingle, TaskFromChatBatch],
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    if isinstance(body, TaskFromChatBatch):
        created = [
            await service.create(user_id=current_user.id, title=item.title)
            for item in body.tasks
        ]
        return TaskBatchResponse(created=created)

    return await service.create(user_id=current_user.id, title=body.title)
