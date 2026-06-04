import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.extraction_service import ExtractionService
from app.models.context_models import ContextFragment


def make_mock_llm(response='{"fragmentos": [{"content": "Gosta de café", "category": "preferencia"}]}'):
    llm = MagicMock()
    llm.generate = AsyncMock(return_value=response)
    return llm


def make_mock_context_repo():
    repo = MagicMock()
    repo.save = AsyncMock(return_value=None)
    return repo


def make_mock_cost_tracker():
    tracker = MagicMock()
    tracker.log_and_check = AsyncMock(return_value=None)
    return tracker


@pytest.fixture
def extraction_service():
    return ExtractionService(
        llm_provider=make_mock_llm(),
        context_repo=make_mock_context_repo(),
        cost_tracker=make_mock_cost_tracker(),
    )


@pytest.mark.asyncio
async def test_extraction_returns_fragments_from_valid_llm_response():
    llm = make_mock_llm('{"fragmentos": [{"content": "Gosta de café", "category": "preferencia"}]}')
    repo = make_mock_context_repo()
    service = ExtractionService(llm_provider=llm, context_repo=repo, cost_tracker=make_mock_cost_tracker())

    fragments = await service.extract_from_diary("entry-1", "texto longo...", "user-1")

    assert len(fragments) == 1
    assert fragments[0]["category"] == "preferencia"
    assert fragments[0]["content"] == "Gosta de café"


@pytest.mark.asyncio
async def test_extraction_returns_empty_list_on_invalid_json():
    llm = make_mock_llm("isso não é json")
    service = ExtractionService(llm_provider=llm, context_repo=make_mock_context_repo(), cost_tracker=make_mock_cost_tracker())

    fragments = await service.extract_from_diary("entry-1", "texto", "user-1")
    assert fragments == []


@pytest.mark.asyncio
async def test_extraction_returns_empty_list_on_missing_key():
    llm = make_mock_llm('{"other_key": []}')
    service = ExtractionService(llm_provider=llm, context_repo=make_mock_context_repo(), cost_tracker=make_mock_cost_tracker())

    fragments = await service.extract_from_diary("entry-1", "texto", "user-1")
    assert fragments == []


@pytest.mark.asyncio
async def test_extraction_saves_fragments_with_is_active_false():
    llm = make_mock_llm('{"fragmentos": [{"content": "dado", "category": "habito"}]}')
    repo = make_mock_context_repo()
    service = ExtractionService(llm_provider=llm, context_repo=repo, cost_tracker=make_mock_cost_tracker())

    await service.extract_from_diary("entry-1", "texto longo " * 10, "user-1")

    repo.save.assert_called_once()
    call_kwargs = repo.save.call_args.kwargs
    assert call_kwargs["is_active"] is False


@pytest.mark.asyncio
async def test_extraction_does_not_block_diary_save():
    """DiaryService calls extract_from_diary via asyncio.create_task (non-blocking)."""
    from app.services.diary_service import DiaryService
    from app.repositories.diary_repository import DiaryRepository
    from app.models.diary_models import DiaryEntry

    mock_repo = MagicMock(spec=DiaryRepository)
    mock_repo.create = AsyncMock(return_value=DiaryEntry(
        id="e1", user_id="u1", content="x" * 101,
        created_at="2024-01-01T00:00:00Z", updated_at="2024-01-01T00:00:00Z",
    ))

    mock_extraction = MagicMock()
    mock_extraction.extract_from_diary = AsyncMock(return_value=[])

    with patch("asyncio.create_task") as mock_task:
        service = DiaryService(repository=mock_repo, extraction_service=mock_extraction)
        await service.create(user_id="u1", content="x" * 101)
        mock_task.assert_called_once()


@pytest.mark.asyncio
async def test_extraction_logs_token_cost():
    llm = make_mock_llm('{"fragmentos": [{"content": "dado", "category": "habito"}]}')
    cost_tracker = make_mock_cost_tracker()
    service = ExtractionService(llm_provider=llm, context_repo=make_mock_context_repo(), cost_tracker=cost_tracker)

    await service.extract_from_diary("entry-1", "texto", "user-1")

    cost_tracker.log_and_check.assert_called_once()
