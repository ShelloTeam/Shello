import logging
from datetime import date
from app.repositories.task_repository import TaskRepository
from app.schemas.tasks import TaskCreate, TaskUpdate

logger = logging.getLogger(__name__)


class TaskService:
    def __init__(self, repo: TaskRepository) -> None:
        self._repo = repo

    def _enrich_task(self, task: dict) -> dict:
        is_overdue = False
        if task.get("due_date") and task.get("status") != "done":
            try:
                due_date = date.fromisoformat(task["due_date"])
                if due_date < date.today():
                    is_overdue = True
            except (ValueError, TypeError):
                pass
        task["is_overdue"] = is_overdue
        return task

    def list_tasks(self, user_id: str, status: str | None = None) -> list[dict]:
        tasks = self._repo.list_by_user(user_id, status)
        return [self._enrich_task(t) for t in tasks]

    def get_task(self, task_id: str, user_id: str) -> dict:
        task = self._repo.get_by_id(task_id, user_id)
        if not task:
            raise ValueError("Tarefa não encontrada.")
        return self._enrich_task(task)

    def create_task(self, user_id: str, data: TaskCreate) -> dict:
        due_date_str = data.due_date.isoformat() if data.due_date else None
        task = self._repo.create(
            user_id=user_id,
            title=data.title,
            description=data.description,
            due_date=due_date_str,
        )
        return self._enrich_task(task)

    def update_task(self, task_id: str, user_id: str, data: TaskUpdate) -> dict:
        # Monta dict apenas com campos enviados (exclui None)
        fields = {}
        if data.title is not None:
            fields["title"] = data.title
        if data.description is not None:
            fields["description"] = data.description
        if data.due_date is not None:
            fields["due_date"] = data.due_date.isoformat()
        if data.status is not None:
            fields["status"] = data.status

        if not fields:
            raise ValueError("Nenhum campo para atualizar.")

        task = self._repo.update(task_id, user_id, fields)
        if not task:
            raise ValueError("Tarefa não encontrada.")
        return self._enrich_task(task)

    def delete_task(self, task_id: str, user_id: str) -> None:
        deleted = self._repo.delete(task_id, user_id)
        if not deleted:
            raise ValueError("Tarefa não encontrada.")