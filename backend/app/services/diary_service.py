from __future__ import annotations
import asyncio
from app.models.diary_models import DiaryEntry
from app.repositories.diary_repository import DiaryRepository
from app.services.extraction_service import ExtractionService


class DiaryService:
    """
    Lógica de negócio do diário pessoal.

    Orquestra criação, edição, exclusão e busca de anotações.
    Dispara extração assíncrona de contexto para conteúdos longos.

    Attributes:
        repository: DiaryRepository para persistência.
        extraction_service: ExtractionService para extração de fragmentos de contexto.

    Raises:
        ValueError: Conteúdo vazio ou apenas espaços.
        PermissionError: Tentativa de modificar anotação de outro usuário.
    """

    def __init__(self, repository: DiaryRepository, extraction_service: ExtractionService):
        self.repository = repository
        self.extraction_service = extraction_service

    async def create(self, user_id: str, content: str) -> DiaryEntry:
        """
        Valida e persiste anotação. Dispara extração assíncrona se conteúdo > 100 chars.

        Args:
            user_id: UUID do usuário autenticado.
            content: Texto da anotação (max 10.000 chars).

        Returns:
            DiaryEntry criado.

        Raises:
            ValueError: Se content for vazio ou só espaços.
        """
        if not content.strip():
            raise ValueError("Conteúdo não pode ser vazio.")
        entry = await self.repository.create(user_id=user_id, content=content)
        if len(content) > 100:
            asyncio.create_task(
                self.extraction_service.extract_from_diary(entry.id, content, user_id)
            )
        return entry

    async def list(self, user_id: str, page: int = 1, page_size: int = 20) -> list[DiaryEntry]:
        """Lista anotações paginadas do usuário."""
        return await self.repository.list_by_user(user_id=user_id, page=page, page_size=page_size)

    async def update(self, entry_id: str, current_user_id: str, content: str) -> DiaryEntry:
        """
        Atualiza conteúdo da anotação após verificar ownership.

        Raises:
            PermissionError: Se a anotação pertencer a outro usuário.
        """
        await self._assert_owner(entry_id, current_user_id)
        return await self.repository.update(entry_id=entry_id, content=content)

    async def delete(self, entry_id: str, current_user_id: str) -> None:
        """
        Remove anotação após verificar ownership.

        Raises:
            PermissionError: Se a anotação pertencer a outro usuário.
        """
        await self._assert_owner(entry_id, current_user_id)
        await self.repository.delete(entry_id=entry_id)

    async def search(self, user_id: str, query: str) -> list[DiaryEntry]:
        """Busca anotações via ILIKE pelo conteúdo."""
        return await self.repository.search(user_id=user_id, query=query)

    async def _assert_owner(self, entry_id: str, user_id: str) -> None:
        """Verifica se a anotação pertence ao usuário. Lança PermissionError se não."""
        entry = await self.repository.get_by_id(entry_id)
        if entry is None or entry.user_id != user_id:
            raise PermissionError("Sem permissão para modificar esta anotação.")
