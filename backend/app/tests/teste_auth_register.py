import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app, follow_redirects=False)


# ─── Helpers ────────────────────────────────────────────────────────────────

VALID_PAYLOAD = {"email": "novo@exemplo.com", "password": "Senha@Forte1"}


def _mock_service(email_exists=False, user_id="uuid-123"):
    """Retorna um AuthService mockado."""
    mock = MagicMock()
    mock.register_user.return_value = "fake.jwt.token"
    return mock


# ─── Cadastro válido ─────────────────────────────────────────────────────────

def test_register_success_redirects_to_onboarding():
    with patch("app.api.v1.auth.get_auth_service", return_value=_mock_service()):
        response = client.post("/api/v1/auth/register", json=VALID_PAYLOAD)

    assert response.status_code == 303
    assert response.headers["location"] == "/onboarding"


def test_register_success_sets_httponly_cookie():
    with patch("app.api.v1.auth.get_auth_service", return_value=_mock_service()):
        response = client.post("/api/v1/auth/register", json=VALID_PAYLOAD)

    cookie = response.cookies.get("access_token")
    assert cookie is not None
    # TestClient expõe HttpOnly via headers
    set_cookie_header = response.headers.get("set-cookie", "")
    assert "HttpOnly" in set_cookie_header
    assert "SameSite=lax" in set_cookie_header


def test_register_never_redirects_to_home():
    with patch("app.api.v1.auth.get_auth_service", return_value=_mock_service()):
        response = client.post("/api/v1/auth/register", json=VALID_PAYLOAD)

    assert "/home" not in response.headers.get("location", "")


# ─── Cadastro inválido ───────────────────────────────────────────────────────

def test_register_weak_password_returns_422():
    payload = {"email": "a@b.com", "password": "fraca"}
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_invalid_email_returns_422():
    payload = {"email": "nao-e-email", "password": "Senha@Forte1"}
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_duplicate_email_returns_400_generic_message():
    mock = MagicMock()
    mock.register_user.side_effect = ValueError("e-mail duplicado")

    with patch("app.api.v1.auth.get_auth_service", return_value=mock):
        response = client.post("/api/v1/auth/register", json=VALID_PAYLOAD)

    assert response.status_code == 400
    body = response.json()
    # Mensagem genérica — não revela qual campo conflitou
    assert "email" not in body["detail"].lower()
    assert "senha" not in body["detail"].lower()


# ─── Token expirado ──────────────────────────────────────────────────────────

def test_expired_token_returns_401():
    from datetime import timedelta
    from app.core.security import create_access_token
    from app.dependencies.auth import get_current_user
    from fastapi import Request

    expired_token = create_access_token({"sub": "user-1"}, expires_delta=timedelta(seconds=-1))
    client_with_cookie = TestClient(app, follow_redirects=False, cookies={"access_token": expired_token})

    # Cria rota protegida temporária para o teste
    from fastapi import Depends
    from app.dependencies.auth import get_current_user

    @app.get("/test-protected")
    def protected(user=Depends(get_current_user)):
        return {"sub": user.sub}

    response = client_with_cookie.get("/test-protected")
    assert response.status_code == 401


# ─── Acesso sem token ────────────────────────────────────────────────────────

def test_protected_route_without_token_returns_401():
    @app.get("/test-no-token")
    def no_token_route(user=__import__("app.dependencies.auth", fromlist=["get_current_user"]).get_current_user):
        return {"ok": True}

    response = client.get("/test-no-token")
    assert response.status_code == 401


# ─── Acesso com token válido ─────────────────────────────────────────────────

def test_protected_route_with_valid_token_returns_200():
    from app.core.security import create_access_token
    from app.dependencies.auth import get_current_user
    from fastapi import Depends

    token = create_access_token({"sub": "user-42"})

    @app.get("/test-valid-token")
    def valid_token_route(user=Depends(get_current_user)):
        return {"sub": user.sub}

    auth_client = TestClient(app, cookies={"access_token": token})
    response = auth_client.get("/test-valid-token")
    assert response.status_code == 200
    assert response.json()["sub"] == "user-42"