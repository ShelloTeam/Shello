import logging
from supabase import create_client, Client
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class TaskRepository:
    def __init__(self) -> None:
        self._client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key,
        )

    def list_by_user(self, user_id: str, status: str | None = None) -> list[dict]:
        """Lista todas as tarefas do usuário ordenadas por created_at desc."""
        try:
            query = (
                self._client.table("tasks")
                .select("id, user_id, title, description, due_date, status, created_at, updated_at")
                .eq("user_id", user_id)
            )
            if status:
                query = query.eq("status", status)
                
            result = query.order("created_at", desc=True).execute()
            return result.data
        except Exception:
            logger.error("Erro ao listar tarefas: user_id=%s", user_id)
            raise

    def get_by_id(self, task_id: str, user_id: str) -> dict | None:
        """Busca tarefa por ID garantindo que pertence ao usuário."""
        try:
            result = (
                self._client.table("tasks")
                .select("id, user_id, title, description, due_date, status, created_at, updated_at")
                .eq("id", task_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception:
            logger.error("Erro ao buscar tarefa: task_id=%s", task_id)
            raise

    def create(self, user_id: str, title: str, description: str | None, due_date: str | None) -> dict:
        """Insere nova tarefa. user_id sempre vem do JWT, nunca do body."""
        try:
            payload = {
                "user_id": user_id,
                "title": title,
                "description": description,
                "due_date": due_date,
                "status": "pending",
            }
            # Remove campos None para não sobrescrever defaults do banco
            payload = {k: v for k, v in payload.items() if v is not None}

            result = self._client.table("tasks").insert(payload).execute()
            if not result.data:
                raise RuntimeError("Inserção retornou dados vazios.")
            logger.info("Tarefa criada: id=%s user_id=%s", result.data[0]["id"], user_id)
            return result.data[0]
        except Exception:
            logger.error("Erro ao criar tarefa")
            raise

    def update(self, task_id: str, user_id: str, fields: dict) -> dict | None:
        """
        Atualiza apenas os campos fornecidos.
        Filtra user_id para garantir ownership — RLS é a segunda barreira.
        """
        try:
            result = (
                self._client.table("tasks")
                .update(fields)
                .eq("id", task_id)
                .eq("user_id", user_id)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception:
            logger.error("Erro ao atualizar tarefa: task_id=%s", task_id)
            raise

    def delete(self, task_id: str, user_id: str) -> bool:
        """Deleta tarefa. Retorna True se deletou, False se não encontrou."""
        try:
            result = (
                self._client.table("tasks")
                .delete()
                .eq("id", task_id)
                .eq("user_id", user_id)
                .execute()
            )
            deleted = len(result.data) > 0
            if deleted:
                logger.info("Tarefa deletada: task_id=%s user_id=%s", task_id, user_id)
            return deleted
        except Exception:
            logger.error("Erro ao deletar tarefa: task_id=%s", task_id)
            raise