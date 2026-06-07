import pytest
from unittest.mock import AsyncMock, MagicMock


# ── SERVICE UNIT TESTS ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_memory_service_create_returns_memory():
    from app.services.memory_service import MemoryService
    from app.repositories.context_fragment_repository import ContextFragmentRepository

    mock_repo = MagicMock(spec=ContextFragmentRepository)
    mock_repo.create = MagicMock(return_value={
        "id": "m-uuid", "user_id": "u1",
        "content": "Prefere comunicação direta",
        "category": "PREFERENCIA",
        "is_active": True,
        "derived_from_conversation_id": None,
        "created_at": "2024-01-01T00:00:00Z",
    })

    service = MemoryService(repository=mock_repo)
    memory = await service.create(
        user_id="u1",
        content="Prefere comunicação direta",
        tipo="PREFERENCIA",
    )

    assert memory.id == "m-uuid"
    assert memory.tipo == "PREFERENCIA"
    assert memory.conteudo == "Prefere comunicação direta"


@pytest.mark.asyncio
async def test_memory_service_list_returns_only_memories():
    from app.services.memory_service import MemoryService
    from app.repositories.context_fragment_repository import ContextFragmentRepository

    mock_repo = MagicMock(spec=ContextFragmentRepository)
    mock_repo.list_active = MagicMock(return_value=[
        {"id": "m1", "user_id": "u1", "content": "Gosta de café",
         "category": "FATO", "is_active": True,
         "derived_from_conversation_id": None, "created_at": "2024-01-01T00:00:00Z"},
        {"id": "m2", "user_id": "u1", "content": "Quer aprender Python",
         "category": "OBJETIVO", "is_active": True,
         "derived_from_conversation_id": None, "created_at": "2024-01-01T00:00:00Z"},
    ])

    service = MemoryService(repository=mock_repo)
    memories = await service.list(user_id="u1")

    assert len(memories) == 2
    assert memories[0].tipo == "FATO"
    assert memories[1].tipo == "OBJETIVO"


@pytest.mark.asyncio
async def test_memory_service_delete_raises_not_found_when_missing():
    from app.services.memory_service import MemoryService
    from app.repositories.context_fragment_repository import ContextFragmentRepository

    mock_repo = MagicMock(spec=ContextFragmentRepository)
    mock_repo.delete = MagicMock(return_value=False)

    service = MemoryService(repository=mock_repo)
    with pytest.raises(KeyError):
        await service.delete(memory_id="missing", user_id="u1")


# ── HTTP INTEGRATION TESTS ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_memory_returns_201(client_memories_ok):
    response = await client_memories_ok.post(
        "/api/memories",
        json={"conteudo": "Prefere emails curtos", "tipo": "PREFERENCIA"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["tipo"] == "PREFERENCIA"
    assert data["conteudo"] == "Prefere emails curtos"


@pytest.mark.asyncio
async def test_create_memory_invalid_tipo_returns_422(client_memories_ok):
    response = await client_memories_ok.post(
        "/api/memories",
        json={"conteudo": "X", "tipo": "INVALIDO"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_memory_requires_auth(client_memories_ok):
    response = await client_memories_ok.post(
        "/api/memories",
        json={"conteudo": "X", "tipo": "FATO"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_memories_returns_200(client_memories_ok):
    response = await client_memories_ok.get(
        "/api/memories",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_delete_memory_returns_204(client_memories_ok):
    response = await client_memories_ok.delete(
        "/api/memories/m-uuid",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_memory_not_found_returns_404(client_memories_not_found):
    response = await client_memories_not_found.delete(
        "/api/memories/missing",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 404
