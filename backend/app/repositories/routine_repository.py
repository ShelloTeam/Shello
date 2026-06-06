import logging
from supabase import create_client, Client
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class RoutineRepository:
    def __init__(self) -> None:
        self._client: Client = create_client(settings.supabase_url, settings.supabase_key)

    def list_by_user(self, user_id: str) -> list[dict]:
        try:
            result = (
                self._client.table("routines")
                .select("id, user_id, nome, atividades, periodo, created_at, updated_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            return result.data
        except Exception:
            logger.error("Erro ao listar rotinas: user_id=%s", user_id)
            raise

    def get_by_id(self, routine_id: str, user_id: str) -> dict | None:
        try:
            result = (
                self._client.table("routines")
                .select("id, user_id, nome, atividades, periodo, created_at, updated_at")
                .eq("id", routine_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception:
            logger.error("Erro ao buscar rotina: routine_id=%s", routine_id)
            raise

    def create(self, user_id: str, nome: str, atividades: list[str], periodo: str) -> dict:
        try:
            payload = {
                "user_id": user_id,
                "nome": nome,
                "atividades": atividades,
                "periodo": periodo,
            }
            result = self._client.table("routines").insert(payload).execute()
            if not result.data:
                raise RuntimeError("Inserção retornou dados vazios.")
            logger.info("Rotina criada: id=%s user_id=%s", result.data[0]["id"], user_id)
            return result.data[0]
        except Exception:
            logger.error("Erro ao criar rotina")
            raise

    def update(self, routine_id: str, user_id: str, fields: dict) -> dict | None:
        try:
            result = (
                self._client.table("routines")
                .update(fields)
                .eq("id", routine_id)
                .eq("user_id", user_id)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception:
            logger.error("Erro ao atualizar rotina: routine_id=%s", routine_id)
            raise

    def delete(self, routine_id: str, user_id: str) -> bool:
        try:
            result = (
                self._client.table("routines")
                .delete()
                .eq("id", routine_id)
                .eq("user_id", user_id)
                .execute()
            )
            deleted = len(result.data) > 0
            if deleted:
                logger.info("Rotina deletada: routine_id=%s user_id=%s", routine_id, user_id)
            return deleted
        except Exception:
            logger.error("Erro ao deletar rotina: routine_id=%s", routine_id)
            raise
