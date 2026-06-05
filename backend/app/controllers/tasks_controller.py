from __future__ import annotations
from fastapi import APIRouter, Depends
from typing import Union
from app.models.task_models import TaskFromChatSingle, TaskFromChatBatch, TaskBatchResponse
from app.services.task_service import TaskService
from app.repositories.task_repository import TaskRepository
from app.core.dependencies import get_current_user, User

router = APIRouter(prefix="/api/tasks", tags=["Tarefas"])


def get_task_service() -> TaskService:
    return TaskService(repo=TaskRepository())


@router.post(
    "/from-chat",
    status_code=201,
    summary="Criar tarefa(s) confirmada(s) via chat",
    description="""
Cria uma ou até 3 tarefas a partir de títulos confirmados pelo usuário via chat.

**Regras:**
- `due_date` é sempre `null` — nunca parseia data de texto livre
- Máximo 3 tarefas por chamada
- Chamado apenas após confirmação explícita do usuário no frontend

**Autenticação:** Bearer token JWT obrigatório
""",
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
