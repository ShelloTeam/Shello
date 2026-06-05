import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse

from app.repositories.task_repository import TaskRepository
from app.services.task_service import TaskService
from app.schemas.tasks import TaskCreate, TaskUpdate, TaskStatusToggle
from app.dependencies.auth import get_current_user, require_onboarding_done
from app.schemas.auth import TokenData

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


def get_task_service() -> TaskService:
    return TaskService(repo=TaskRepository())


@router.get("", status_code=status.HTTP_200_OK)
async def list_tasks(
    status_filter: str | None = Query(None, alias="status"),
    current_user: TokenData = Depends(require_onboarding_done),
    service: TaskService = Depends(get_task_service),
):
    """Lista todas as tarefas do usuário autenticado."""
    try:
        tasks = service.list_tasks(current_user.sub, status_filter)
        return JSONResponse(content={"tasks": tasks})
    except Exception:
        logger.exception("Erro ao listar tarefas")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")


@router.get("/{task_id}", status_code=status.HTTP_200_OK)
async def get_task(
    task_id: str,
    current_user: TokenData = Depends(require_onboarding_done),
    service: TaskService = Depends(get_task_service),
):
    """Retorna uma tarefa pelo ID."""
    try:
        task = service.get_task(task_id, current_user.sub)
        return JSONResponse(content=task)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado ou tarefa não encontrada.")
    except Exception:
        logger.exception("Erro ao buscar tarefa")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    current_user: TokenData = Depends(require_onboarding_done),
    service: TaskService = Depends(get_task_service),
):
    """
    Cria nova tarefa.
    - título obrigatório
    - descrição e due_date opcionais
    - status inicia como 'pending'
    - user_id sempre vem do JWT, nunca do body
    """
    try:
        task = service.create_task(current_user.sub, data)
        return JSONResponse(content=task, status_code=status.HTTP_201_CREATED)
    except Exception:
        logger.exception("Erro ao criar tarefa")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")


@router.patch("/{task_id}", status_code=status.HTTP_200_OK)
async def update_task(
    task_id: str,
    data: TaskUpdate,
    current_user: TokenData = Depends(require_onboarding_done),
    service: TaskService = Depends(get_task_service),
):
    """
    Atualiza campos da tarefa. Todos opcionais — envia apenas o que mudar.
    Use status='done' para marcar como concluída.
    """
    try:
        task = service.update_task(task_id, current_user.sub, data)
        return JSONResponse(content=task)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado ou tarefa não encontrada.")
    except Exception:
        logger.exception("Erro ao atualizar tarefa")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")


@router.patch("/{task_id}/status", status_code=status.HTTP_200_OK)
async def toggle_task_status(
    task_id: str,
    data: TaskStatusToggle,
    current_user: TokenData = Depends(require_onboarding_done),
    service: TaskService = Depends(get_task_service),
):
    """Alterna o status da tarefa rapidamente."""
    try:
        task = service.update_task(task_id, current_user.sub, TaskUpdate(status=data.status))
        return JSONResponse(content=task)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado ou tarefa não encontrada.")
    except Exception:
        logger.exception("Erro ao alternar status da tarefa")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: TokenData = Depends(require_onboarding_done),
    service: TaskService = Depends(get_task_service),
):
    """Deleta tarefa. Retorna 404 se não existir ou não pertencer ao usuário."""
    try:
        service.delete_task(task_id, current_user.sub)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado ou tarefa não encontrada.")
    except Exception:
        logger.exception("Erro ao deletar tarefa")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")