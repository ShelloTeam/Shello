import pytest
from unittest.mock import AsyncMock, MagicMock


@pytest.mark.asyncio
async def test_update_preferences_returns_200(client_settings_ok):
    response = await client_settings_ok.put(
        "/api/users/preferences",
        json={"formalidade": "alta", "nome_referencia": "Edu"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    assert response.json()["formalidade"] == "alta"
    assert response.json()["nome_referencia"] == "Edu"


@pytest.mark.asyncio
async def test_update_preferences_invalid_formalidade_returns_422(client_settings_ok):
    response = await client_settings_ok.put(
        "/api/users/preferences",
        json={"formalidade": "invalida"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_preferences_nome_referencia_max_30_chars(client_settings_ok):
    response = await client_settings_ok.put(
        "/api/users/preferences",
        json={"nome_referencia": "x" * 31},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_preferences_requires_auth(client_settings_ok):
    response = await client_settings_ok.put(
        "/api/users/preferences",
        json={"formalidade": "alta"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_change_password_success(client_settings_ok):
    response = await client_settings_ok.put(
        "/api/users/password",
        json={"current_password": "senha_atual", "new_password": "novaSenha123"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Senha alterada com sucesso."


@pytest.mark.asyncio
async def test_change_password_wrong_current_returns_401(client_settings_wrong_pw):
    response = await client_settings_wrong_pw.put(
        "/api/users/password",
        json={"current_password": "senha_errada", "new_password": "novaSenha123"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_change_password_new_too_short_returns_422(client_settings_ok):
    response = await client_settings_ok.put(
        "/api/users/password",
        json={"current_password": "senha_atual", "new_password": "curta"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_change_password_requires_auth(client_settings_ok):
    response = await client_settings_ok.put(
        "/api/users/password",
        json={"current_password": "senha_atual", "new_password": "novaSenha123"},
    )
    assert response.status_code == 401


# ── SERVICE UNIT TESTS ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_preferences_sync_across_sessions():
    from app.services.user_service import UserService
    from app.repositories.user_repository import UserRepository
    from app.models.user_models import UserPreferences

    mock_repo = MagicMock(spec=UserRepository)
    mock_repo.update_preferences = AsyncMock(return_value=UserPreferences(
        formalidade="baixa", nome_referencia="Edu", theme="dark",
    ))
    mock_repo.get_preferences = AsyncMock(return_value=UserPreferences(
        formalidade="baixa", nome_referencia="Edu", theme="dark",
    ))

    svc = UserService(repository=mock_repo)
    await svc.update_preferences("user-1", formalidade="baixa", nome_referencia="Edu")
    prefs = await svc.get_preferences("user-1")
    assert prefs.formalidade == "baixa"


@pytest.mark.asyncio
async def test_change_password_validates_current():
    from app.services.user_service import UserService
    from app.repositories.user_repository import UserRepository

    mock_repo = MagicMock(spec=UserRepository)
    mock_repo.verify_password = AsyncMock(return_value=False)

    svc = UserService(repository=mock_repo)
    with pytest.raises(PermissionError):
        await svc.change_password("user-1", "senha_errada", "novaSenha123")
