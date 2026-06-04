import pytest
import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.history_service import HistoryService
from app.models.history_models import HistoryItem, HistoryResponse


def make_conv_item(created_at="2024-01-05T10:00:00"):
    return HistoryItem(
        id="conv-uuid",
        type="conversation",
        preview="Conversa sobre tarefas",
        created_at=datetime.fromisoformat(created_at),
        item_count=5,
    )


def make_diary_item(created_at="2024-01-03T10:00:00"):
    return HistoryItem(
        id="diary-uuid",
        type="diary",
        preview="Hoje foi produtivo",
        created_at=datetime.fromisoformat(created_at),
        item_count=12,
    )


def make_mock_history_repo(conv=None, diary=None):
    repo = MagicMock()
    repo.list_conversations = AsyncMock(return_value=[conv or make_conv_item()])
    repo.list_diary_entries = AsyncMock(return_value=[diary or make_diary_item()])
    repo.search_conversations = AsyncMock(return_value=[make_conv_item()])
    repo.search_diary_entries = AsyncMock(return_value=[make_diary_item()])
    return repo


@pytest.mark.asyncio
async def test_list_unified_returns_both_types():
    repo = make_mock_history_repo()
    service = HistoryService(repository=repo)
    result = await service.list_unified(user_id="user-1")
    types = [item.type for item in result.items]
    assert "conversation" in types
    assert "diary" in types


@pytest.mark.asyncio
async def test_list_unified_filters_by_type_conversation():
    repo = make_mock_history_repo()
    service = HistoryService(repository=repo)
    await service.list_unified(user_id="user-1", type_filter="conversation")
    repo.list_diary_entries.assert_not_called()


@pytest.mark.asyncio
async def test_list_unified_filters_by_type_diary():
    repo = make_mock_history_repo()
    service = HistoryService(repository=repo)
    await service.list_unified(user_id="user-1", type_filter="diary")
    repo.list_conversations.assert_not_called()


def test_merge_sorted_returns_items_in_desc_order():
    service = HistoryService(repository=MagicMock())
    items_a = [make_conv_item(created_at="2024-01-03T00:00:00")]
    items_b = [make_diary_item(created_at="2024-01-05T00:00:00")]
    merged = service._merge_sorted(items_a, items_b)
    assert merged[0].created_at > merged[1].created_at


@pytest.mark.asyncio
async def test_search_filters_by_keyword():
    repo = make_mock_history_repo()
    service = HistoryService(repository=repo)
    await service.list_unified(user_id="user-1", query="café")
    repo.search_conversations.assert_called_with(user_id="user-1", query="café")
    repo.search_diary_entries.assert_called_with(user_id="user-1", query="café")


@pytest.mark.asyncio
async def test_history_uses_parallel_queries():
    repo = make_mock_history_repo()
    service = HistoryService(repository=repo)
    with patch("asyncio.gather", wraps=asyncio.gather) as mock_gather:
        await service.list_unified(user_id="user-1")
        mock_gather.assert_called_once()


@pytest.mark.asyncio
async def test_history_endpoint_returns_401_without_auth(client):
    response = await client.get("/api/history")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_history_response_has_correct_schema(client_history_ok):
    response = await client_history_ok.get(
        "/api/history",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body
    assert "has_more" in body
