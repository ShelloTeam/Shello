import pytest
from unittest.mock import AsyncMock, MagicMock


# ── SERVICE UNIT TESTS ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_routine_service_create_returns_routine():
    from app.services.routine_service import RoutineService
    from app.repositories.routine_repository import RoutineRepository

    mock_repo = MagicMock(spec=RoutineRepository)
    mock_repo.create = MagicMock(return_value={
        "id": "r-uuid", "user_id": "u1", "nome": "Manhã saudável",
        "atividades": ["Água", "Meditação"], "periodo": "manha",
        "created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-01T00:00:00Z",
    })

    service = RoutineService(repository=mock_repo)
    routine = await service.create(
        user_id="u1", nome="Manhã saudável",
        atividades=["Água", "Meditação"], periodo="manha",
    )

    assert routine.id == "r-uuid"
    assert routine.nome == "Manhã saudável"
    assert routine.atividades == ["Água", "Meditação"]
    assert routine.periodo == "manha"


@pytest.mark.asyncio
async def test_routine_service_list_returns_list():
    from app.services.routine_service import RoutineService
    from app.repositories.routine_repository import RoutineRepository

    mock_repo = MagicMock(spec=RoutineRepository)
    mock_repo.list_by_user = MagicMock(return_value=[
        {"id": "r1", "user_id": "u1", "nome": "R1", "atividades": [], "periodo": "tarde",
         "created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-01T00:00:00Z"},
    ])

    service = RoutineService(repository=mock_repo)
    routines = await service.list(user_id="u1")

    assert len(routines) == 1
    assert routines[0].nome == "R1"


@pytest.mark.asyncio
async def test_routine_service_delete_returns_true_when_found():
    from app.services.routine_service import RoutineService
    from app.repositories.routine_repository import RoutineRepository

    mock_repo = MagicMock(spec=RoutineRepository)
    mock_repo.delete = MagicMock(return_value=True)

    service = RoutineService(repository=mock_repo)
    result = await service.delete(routine_id="r-uuid", user_id="u1")

    assert result is True


@pytest.mark.asyncio
async def test_routine_service_delete_raises_not_found_when_missing():
    from app.services.routine_service import RoutineService
    from app.repositories.routine_repository import RoutineRepository

    mock_repo = MagicMock(spec=RoutineRepository)
    mock_repo.delete = MagicMock(return_value=False)

    service = RoutineService(repository=mock_repo)
    with pytest.raises(KeyError):
        await service.delete(routine_id="missing", user_id="u1")


# ── HTTP INTEGRATION TESTS ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_routine_returns_201(client_routines_ok):
    response = await client_routines_ok.post(
        "/api/routines",
        json={"nome": "Manhã saudável", "atividades": ["Água"], "periodo": "manha"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["nome"] == "Manhã saudável"
    assert data["periodo"] == "manha"


@pytest.mark.asyncio
async def test_create_routine_empty_name_returns_422(client_routines_ok):
    response = await client_routines_ok.post(
        "/api/routines",
        json={"nome": "", "atividades": [], "periodo": "manha"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_routine_invalid_periodo_returns_422(client_routines_ok):
    response = await client_routines_ok.post(
        "/api/routines",
        json={"nome": "X", "atividades": [], "periodo": "almoco"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_routine_requires_auth(client_routines_ok):
    response = await client_routines_ok.post(
        "/api/routines",
        json={"nome": "X", "atividades": [], "periodo": "manha"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_routines_returns_200(client_routines_ok):
    response = await client_routines_ok.get(
        "/api/routines",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_delete_routine_returns_204(client_routines_ok):
    response = await client_routines_ok.delete(
        "/api/routines/r-uuid",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_routine_not_found_returns_404(client_routines_not_found):
    response = await client_routines_not_found.delete(
        "/api/routines/missing",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 404
