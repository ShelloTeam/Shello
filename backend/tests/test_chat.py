import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.core.mode_detector import detect_mode
from app.services.chat_service import ChatService
from app.core.llm.exceptions import LLMProviderError
from app.models.chat_models import Conversation, ChatResponse


def make_mock_chat_repo(message_count=0):
    repo = MagicMock()
    conv = Conversation(
        id="conv-uuid",
        user_id="user-1",
        message_count=message_count,
        is_active=True,
    )
    repo.get_active_conversation = AsyncMock(return_value=conv)
    repo.create_conversation = AsyncMock(return_value=conv)
    repo.save_message = AsyncMock(return_value=None)
    repo.increment_message_count = AsyncMock(return_value=None)
    repo.get_history = AsyncMock(return_value=[])
    repo.archive_before = AsyncMock(return_value=None)
    return repo


def make_mock_context_repo():
    repo = MagicMock()
    repo.get_active_fragments = AsyncMock(return_value=[])
    return repo


def make_mock_llm(response="resposta do agente", safe=True):
    llm = MagicMock()
    llm.generate = AsyncMock(return_value=response)
    llm.moderate = AsyncMock(return_value=safe)
    return llm


# ── MODE DETECTOR ──────────────────────────────────────────────────────────────

def test_detect_mode_returns_pratico_for_task_keyword():
    assert detect_mode("quero criar tarefa para amanhã") == "PRATICO"


def test_detect_mode_returns_padrao_for_regular_message():
    assert detect_mode("como você está hoje?") == "PADRAO"


def test_detect_mode_is_case_insensitive():
    assert detect_mode("CRIAR TAREFA urgente") == "PRATICO"


def test_detect_mode_pratico_for_lembrar():
    assert detect_mode("me lembra de comprar pão") == "PRATICO"


def test_detect_mode_pratico_for_agendar():
    assert detect_mode("agendar reunião amanhã") == "PRATICO"


# ── PROMPT BUILDER ─────────────────────────────────────────────────────────────

def test_prompt_builder_includes_all_6_blocks():
    from app.core.prompt_builder import PromptBuilder
    prompt = PromptBuilder().build(
        user_name="Eduardo",
        formalidade="media",
        fragments=[],
        history=[],
        mode="PADRAO",
        message="oi",
    )
    assert "IDENTIDADE" in prompt
    assert "PARÂMETROS" in prompt
    assert "CONTEXTO" in prompt
    assert "MODO" in prompt
    assert "HISTÓRICO" in prompt
    assert "oi" in prompt


def test_prompt_builder_truncates_history_to_reasonable_length():
    from app.core.prompt_builder import PromptBuilder
    long_history = [{"role": "user", "content": "x" * 200}] * 20
    prompt = PromptBuilder().build(
        user_name="Eduardo",
        formalidade="media",
        fragments=[],
        history=long_history,
        mode="PADRAO",
        message="mensagem curta",
    )
    assert len(prompt) < 20000


# ── CHAT SERVICE ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_chat_blocks_after_20_messages():
    repo = make_mock_chat_repo(message_count=20)
    service = ChatService(
        chat_repository=repo,
        llm_provider=make_mock_llm(),
        context_repository=make_mock_context_repo(),
    )
    with pytest.raises(ValueError, match="20"):
        await service.send(user_id="user-1", message="oi")


@pytest.mark.asyncio
async def test_chat_does_not_save_blocked_response():
    repo = make_mock_chat_repo()
    llm = make_mock_llm(safe=False)
    service = ChatService(
        chat_repository=repo,
        llm_provider=llm,
        context_repository=make_mock_context_repo(),
    )
    result = await service.send(user_id="user-1", message="mensagem")
    repo.save_message.assert_not_called()
    assert result.blocked is True


@pytest.mark.asyncio
async def test_chat_saves_messages_when_response_approved():
    repo = make_mock_chat_repo()
    llm = make_mock_llm(safe=True)
    service = ChatService(
        chat_repository=repo,
        llm_provider=llm,
        context_repository=make_mock_context_repo(),
    )
    await service.send(user_id="user-1", message="mensagem")
    assert repo.save_message.call_count == 2


@pytest.mark.asyncio
async def test_chat_returns_503_when_llm_fails(client):
    response = await client.post(
        "/api/chat",
        json={"message": "oi"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_chat_returns_401_without_auth(client):
    response = await client.post("/api/chat", json={"message": "oi"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_chat_returns_400_when_limit_exceeded(client_chat_limit):
    response = await client_chat_limit.post(
        "/api/chat",
        json={"message": "oi"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 400
