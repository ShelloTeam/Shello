import pytest
from unittest.mock import AsyncMock, MagicMock


@pytest.mark.asyncio
async def test_create_task_from_chat_returns_201(client_tasks_ok):
    response = await client_tasks_ok.post(
        "/api/tasks/from-chat",
        json={"title": "Comprar pão"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Comprar pão"


@pytest.mark.asyncio
async def test_create_task_from_chat_due_date_is_null(client_tasks_ok):
    response = await client_tasks_ok.post(
        "/api/tasks/from-chat",
        json={"title": "Tarefa sem data"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.json()["due_date"] is None


@pytest.mark.asyncio
async def test_create_task_from_chat_empty_title_returns_422(client_tasks_ok):
    response = await client_tasks_ok.post(
        "/api/tasks/from-chat",
        json={"title": ""},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_task_from_chat_requires_auth(client_tasks_ok):
    response = await client_tasks_ok.post(
        "/api/tasks/from-chat",
        json={"title": "Teste"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_multiple_tasks_from_chat(client_tasks_ok):
    response = await client_tasks_ok.post(
        "/api/tasks/from-chat",
        json={"tasks": [{"title": "Tarefa 1"}, {"title": "Tarefa 2"}]},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 201
    assert len(response.json()["created"]) == 2


@pytest.mark.asyncio
async def test_create_too_many_tasks_returns_422(client_tasks_ok):
    response = await client_tasks_ok.post(
        "/api/tasks/from-chat",
        json={"tasks": [{"title": f"Tarefa {i}"} for i in range(4)]},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 422


# ── SERVICE UNIT TEST ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_task_service_create_sets_due_date_null():
    from app.services.task_service import TaskService
    from app.repositories.task_repository import TaskRepository
    from app.models.task_models import Task

    mock_repo = MagicMock(spec=TaskRepository)
    mock_repo.create = MagicMock(return_value={
        "id": "task-uuid", "user_id": "u1", "title": "Comprar pão",
        "status": "pending", "due_date": None,
    })

    service = TaskService(repository=mock_repo)
    task = await service.create(user_id="u1", title="Comprar pão")
    assert task.due_date is None
