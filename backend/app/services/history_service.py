from __future__ import annotations
import asyncio
from app.models.history_models import HistoryItem, HistoryResponse
from app.repositories.history_repository import HistoryRepository


class HistoryService:
    """
    Histórico unificado de conversas e anotações do diário.

    Queries feitas em paralelo via asyncio.gather para minimizar latência.
    Merge ordenado por created_at DESC via _merge_sorted().

    Attributes:
        repository: HistoryRepository para acesso ao banco.
    """

    def __init__(self, repository: HistoryRepository):
        self.repository = repository

    async def list_unified(
        self,
        user_id: str,
        type_filter: str | None = None,
        query: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> HistoryResponse:
        """
        Retorna histórico unificado com filtro por tipo e busca por palavra-chave.

        Queries paralelas via asyncio.gather.
        Resultado ordenado por created_at DESC.

        Args:
            user_id: UUID do usuário.
            type_filter: "conversation", "diary" ou None (ambos).
            query: Palavra-chave para busca. None = listar tudo.
            page: Página (base 1).
            page_size: Itens por página.

        Returns:
            HistoryResponse com items, total, page, page_size, has_more.
        """
        conv_items, diary_items = await asyncio.gather(
            self._fetch_conversations(user_id, type_filter, query, page, page_size),
            self._fetch_diary(user_id, type_filter, query, page, page_size),
        )

        merged = self._merge_sorted(conv_items, diary_items)
        paginated = merged[:page_size]

        return HistoryResponse(
            items=paginated,
            total=len(merged),
            page=page,
            page_size=page_size,
            has_more=len(merged) > page_size,
        )

    def _merge_sorted(self, a: list[HistoryItem], b: list[HistoryItem]) -> list[HistoryItem]:
        """Merges two lists sorted by created_at DESC."""
        merged = a + b
        return sorted(merged, key=lambda x: x.created_at, reverse=True)

    async def _fetch_conversations(self, user_id, type_filter, query, page, page_size):
        if type_filter == "diary":
            return []
        if query:
            return await self.repository.search_conversations(user_id=user_id, query=query)
        return await self.repository.list_conversations(user_id=user_id, page=page, page_size=page_size)

    async def _fetch_diary(self, user_id, type_filter, query, page, page_size):
        if type_filter == "conversation":
            return []
        if query:
            return await self.repository.search_diary_entries(user_id=user_id, query=query)
        return await self.repository.list_diary_entries(user_id=user_id, page=page, page_size=page_size)
