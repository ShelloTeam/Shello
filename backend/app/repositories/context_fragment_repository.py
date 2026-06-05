import logging
from supabase import create_client, Client
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

ACTIVE_FRAGMENTS_LIMIT = 20


class ContextFragmentRepository:
    def __init__(self) -> None:
        self._client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key,
        )

    def list_active(self, user_id: str) -> list[dict]:
        """Lista fragmentos ativos do usuário ordenados por created_at desc."""
        try:
            result = (
                self._client.table("context_fragments")
                .select("id, user_id, content, category, is_active, derived_from_conversation_id, created_at")
                .eq("user_id", user_id)
                .eq("is_active", True)
                .order("created_at", desc=True)
                .execute()
            )
            return result.data
        except Exception:
            logger.error("Erro ao listar fragmentos: user_id=%s", user_id)
            raise

    def count_active(self, user_id: str) -> int:
        """Conta fragmentos ativos para validar limite antes de inserir."""
        try:
            result = (
                self._client.table("context_fragments")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .eq("is_active", True)
                .execute()
            )
            return result.count or 0
        except Exception:
            logger.error("Erro ao contar fragmentos ativos: user_id=%s", user_id)
            raise

    def get_by_id(self, fragment_id: str, user_id: str) -> dict | None:
        """Busca fragmento por ID garantindo ownership."""
        try:
            result = (
                self._client.table("context_fragments")
                .select("id, user_id, content, category, is_active, derived_from_conversation_id, created_at")
                .eq("id", fragment_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception:
            logger.error("Erro ao buscar fragmento: fragment_id=%s", fragment_id)
            raise

    def create(
        self,
        user_id: str,
        content: str,
        category: str,
        derived_from_conversation_id: str | None,
    ) -> dict:
        """
        Insere fragmento. user_id sempre vem do JWT.
        derived_from_conversation_id é NULL quando criado manualmente —
        persiste como NULL se a conversa for deletada (ON DELETE SET NULL).
        """
        try:
            payload = {
                "user_id": user_id,
                "content": content,
                "category": category,
                "is_active": True,
            }
            if derived_from_conversation_id:
                payload["derived_from_conversation_id"] = derived_from_conversation_id

            result = self._client.table("context_fragments").insert(payload).execute()
            if not result.data:
                raise RuntimeError("Inserção retornou dados vazios.")
            logger.info(
                "Fragmento criado: id=%s user_id=%s",
                result.data[0]["id"], user_id,
            )
            return result.data[0]
        except Exception:
            logger.error("Erro ao criar fragmento")
            raise

    def patch_active(self, fragment_id: str, user_id: str, is_active: bool) -> dict | None:
        """Atualiza apenas is_active do fragmento."""
        try:
            result = (
                self._client.table("context_fragments")
                .update({"is_active": is_active})
                .eq("id", fragment_id)
                .eq("user_id", user_id)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception:
            logger.error("Erro ao atualizar fragmento: fragment_id=%s", fragment_id)
            raise

    def delete(self, fragment_id: str, user_id: str) -> bool:
        """Exclusão permanente. Retorna True se deletou."""
        try:
            result = (
                self._client.table("context_fragments")
                .delete()
                .eq("id", fragment_id)
                .eq("user_id", user_id)
                .execute()
            )
            deleted = len(result.data) > 0
            if deleted:
                logger.info("Fragmento deletado: fragment_id=%s user_id=%s", fragment_id, user_id)
            return deleted
        except Exception:
            logger.error("Erro ao deletar fragmento: fragment_id=%s", fragment_id)
            raise