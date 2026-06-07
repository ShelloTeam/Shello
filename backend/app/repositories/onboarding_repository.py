import logging
from supabase import create_client, Client
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class OnboardingRepository:
    def __init__(self) -> None:
        self._client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key,
        )

    def get_user(self, user_id: str) -> dict | None:
        """Retorna dados do usuário incluindo onboarding_done."""
        try:
            result = (
                self._client.table("users")
                .select("id, nome_referencia, onboarding_done")
                .eq("id", user_id)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception:
            logger.error("Erro ao buscar usuário: user_id=%s", user_id)
            raise

    def get_onboarding_answers(self, user_id: str) -> dict | None:
        """Retorna respostas já salvas — permite retomar fluxo interrompido."""
        try:
            result = (
                self._client.table("onboarding_answers")
                .select("q1_name, q2_lifestyle, q3_goal")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception:
            logger.error("Erro ao buscar respostas de onboarding: user_id=%s", user_id)
            raise

    def save_onboarding_answers(
        self,
        user_id: str,
        q1_name: str,
        q2_lifestyle: str,
        q3_goal: str,
    ) -> None:
        """Insere respostas em onboarding_answers."""
        try:
            self._client.table("onboarding_answers").insert({
                "user_id": user_id,
                "q1_name": q1_name,
                "q2_lifestyle": q2_lifestyle,
                "q3_goal": q3_goal,
            }).execute()
        except Exception:
            logger.error("Erro ao salvar respostas de onboarding")
            raise

    def update_user_nome_referencia(self, user_id: str, nome: str) -> None:
        """Atualiza users.nome_referencia com resposta da P1."""
        try:
            self._client.table("users").update(
                {"nome_referencia": nome}
            ).eq("id", user_id).execute()
        except Exception:
            logger.error("Erro ao atualizar nome_referencia")
            raise

    def insert_context_fragments(self, user_id: str, fragments: list[dict]) -> None:
        """
        Insere os 3 fragmentos de contexto iniciais.
        Cada item: {"content": str, "category": str}
        """
        try:
            rows = [
                {
                    "user_id": user_id,
                    "content": f["content"],
                    "category": f["category"],
                    "is_active": True,
                }
                for f in fragments
            ]
            self._client.table("context_fragments").insert(rows).execute()
        except Exception:
            logger.error("Erro ao inserir context_fragments")
            raise

    def mark_onboarding_done(self, user_id: str) -> None:
        """Atualiza users.onboarding_done = true."""
        try:
            self._client.table("users").update(
                {"onboarding_done": True}
            ).eq("id", user_id).execute()
        except Exception:
            logger.error("Erro ao marcar onboarding como concluído")
            raise