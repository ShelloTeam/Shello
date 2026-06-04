import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from app.models.diary_models import DiaryEntry, DiaryEntryCreate
from app.repositories.diary_repository import DiaryRepository
from app.services.diary_service import DiaryService
from app.services.extraction_service import ExtractionService


def make_entry(user_id="user-1", content="Hoje foi produtivo", entry_id="entry-uuid"):
    return DiaryEntry(
        id=entry_id,
        user_id=user_id,
        content=content,
        created_at="2024-01-15T14:30:00Z",
        updated_at="2024-01-15T14:30:00Z",
    )


@pytest.fixture
def mock_diary_repo():
    repo = MagicMock()
    repo.create = AsyncMock(return_value=make_entry())
    repo.get_by_id = AsyncMock(return_value=make_entry())
    repo.list_by_user = AsyncMock(return_value=[make_entry()])
    repo.update = AsyncMock(return_value=make_entry())
    repo.delete = AsyncMock(return_value=None)
    repo.search = AsyncMock(return_value=[make_entry()])
    return repo


@pytest.fixture
def mock_extraction():
    svc = MagicMock()
    svc.extract_from_diary = AsyncMock(return_value=[])
    return svc


@pytest.fixture
def diary_service(mock_diary_repo, mock_extraction):
    return DiaryService(repository=mock_diary_repo, extraction_service=mock_extraction)


# ── SERVICE TESTS ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_diary_entry_success(diary_service, mock_diary_repo):
    entry = await diary_service.create(user_id="user-1", content="Hoje foi um dia produtivo")
    assert entry.content == "Hoje foi produtivo"
    mock_diary_repo.create.assert_called_once()


@pytest.mark.asyncio
async def test_create_diary_entry_empty_content_raises_error(diary_service):
    with pytest.raises(ValueError, match="vazio"):
        await diary_service.create(user_id="user-1", content="   ")


@pytest.mark.asyncio
async def test_create_diary_entry_whitespace_only_raises_error(diary_service):
    with pytest.raises(ValueError, match="vazio"):
        await diary_service.create(user_id="user-1", content="\t\n")


@pytest.mark.asyncio
async def test_create_diary_no_extraction_when_content_under_100_chars(
    diary_service, mock_extraction
):
    await diary_service.create(user_id="user-1", content="curto")
    mock_extraction.extract_from_diary.assert_not_called()


@pytest.mark.asyncio
async def test_create_diary_triggers_extraction_when_content_over_100_chars(
    mock_diary_repo, mock_extraction
):
    content = "x" * 101
    with patch("asyncio.create_task") as mock_task:
        service = DiaryService(repository=mock_diary_repo, extraction_service=mock_extraction)
        await service.create(user_id="user-1", content=content)
        mock_task.assert_called_once()


@pytest.mark.asyncio
async def test_delete_diary_entry_wrong_user_raises_forbidden(diary_service, mock_diary_repo):
    mock_diary_repo.get_by_id.return_value = make_entry(user_id="user-2")
    with pytest.raises(PermissionError):
        await diary_service.delete(entry_id="entry-uuid", current_user_id="user-1")


@pytest.mark.asyncio
async def test_delete_diary_entry_correct_user_succeeds(diary_service, mock_diary_repo):
    mock_diary_repo.get_by_id.return_value = make_entry(user_id="user-1")
    await diary_service.delete(entry_id="entry-uuid", current_user_id="user-1")
    mock_diary_repo.delete.assert_called_once()


@pytest.mark.asyncio
async def test_update_diary_entry_wrong_user_raises_forbidden(diary_service, mock_diary_repo):
    mock_diary_repo.get_by_id.return_value = make_entry(user_id="user-2")
    with pytest.raises(PermissionError):
        await diary_service.update(entry_id="entry-uuid", current_user_id="user-1", content="novo")


# ── CONTROLLER TESTS ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_post_diary_returns_201(client):
    response = await client.post(
        "/api/diary",
        json={"content": "texto válido"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_post_diary_empty_returns_422(client):
    response = await client.post(
        "/api/diary",
        json={"content": ""},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_post_diary_no_auth_returns_401(client):
    response = await client.post("/api/diary", json={"content": "texto"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_diary_returns_200(client):
    response = await client.get(
        "/api/diary",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    assert "items" in response.json()


@pytest.mark.asyncio
async def test_delete_diary_other_user_returns_403(client):
    response = await client.delete(
        "/api/diary/entry-of-user1",
        headers={"Authorization": "Bearer test-token-user-2"},
    )
    assert response.status_code in (403, 404)


@pytest.mark.asyncio
async def test_search_diary_returns_results(client):
    response = await client.get(
        "/api/diary/search?q=produtivo",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    assert "items" in response.json()
