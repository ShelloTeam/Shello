import logging
from app.repositories.context_fragment_repository import ContextFragmentRepository, ACTIVE_FRAGMENTS_LIMIT
from app.schemas.context_fragments import ContextFragmentCreate, ContextFragmentPatch

logger = logging.getLogger(__name__)


class ContextFragmentService:
    def __init__(self, repo: ContextFragmentRepository) -> None:
        self._repo = repo

    def list_active(self, user_id: str) -> list[dict]:
        return self._repo.list_active(user_id)

    def get_fragment(self, fragment_id: str, user_id: str) -> dict:
        fragment = self._repo.get_by_id(fragment_id, user_id)
        if not fragment:
            raise ValueError("Fragmento não encontrado.")
        return fragment

    def create_fragment(self, user_id: str, data: ContextFragmentCreate) -> dict:
        """
        Cria fragmento se limite de 20 ativos não for atingido.
        Raises:
            LimitError: limite de fragmentos ativos atingido.
        """
        active_count = self._repo.count_active(user_id)
        if active_count >= ACTIVE_FRAGMENTS_LIMIT:
            raise LimitError(
                f"Limite de {ACTIVE_FRAGMENTS_LIMIT} fragmentos ativos atingido. "
                "Desative ou remova fragmentos antes de criar novos."
            )
        return self._repo.create(
            user_id=user_id,
            content=data.content,
            category=data.category,
        )

    def patch_fragment(self, fragment_id: str, user_id: str, data: ContextFragmentPatch) -> dict:
        """
        Atualiza is_active.
        Se ativando, verifica limite antes de permitir.
        """
        if data.is_active:
            active_count = self._repo.count_active(user_id)
            if active_count >= ACTIVE_FRAGMENTS_LIMIT:
                raise LimitError(
                    f"Limite de {ACTIVE_FRAGMENTS_LIMIT} fragmentos ativos atingido. "
                    "Desative outros fragmentos antes de ativar este."
                )

        fragment = self._repo.patch_active(fragment_id, user_id, data.is_active)
        if not fragment:
            raise ValueError("Fragmento não encontrado.")
        return fragment

    def delete_fragment(self, fragment_id: str, user_id: str) -> None:
        deleted = self._repo.delete(fragment_id, user_id)
        if not deleted:
            raise ValueError("Fragmento não encontrado.")


class LimitError(Exception):
    """Limite de fragmentos ativos atingido."""