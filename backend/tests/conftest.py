import pytest
from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.dependencies import get_supabase
from app.controllers.diary_controller import get_diary_service
from app.controllers.chat_controller import get_chat_service, get_user_repo
from app.controllers.history_controller import get_history_service
from app.controllers.tasks_controller import get_task_service
from app.controllers.user_controller import get_user_service
from app.controllers.routines_controller import get_routine_service
from app.controllers.memories_controller import get_memory_service
from app.models.user_models import UserPreferences
from app.models.routine_models import Routine
from app.models.memory_models import Memory
from app.models.diary_models import DiaryEntry, DiaryListResponse
from app.models.chat_models import Conversation, ChatResponse
from app.models.history_models import HistoryItem, HistoryResponse
from app.models.task_models import Task
from datetime import datetime
from app.core.llm.exceptions import LLMProviderError


def make_mock_supabase():
    db = MagicMock()
    db.table = MagicMock(return_value=db)
    db.select = MagicMock(return_value=db)
    db.eq = MagicMock(return_value=db)
    db.neq = MagicMock(return_value=db)
    db.execute = MagicMock(return_value=MagicMock(data=[]))
    return db


def make_diary_entry(**kwargs):
    defaults = dict(
        id="entry-uuid",
        user_id="user-1",
        content="Hoje foi produtivo",
        created_at="2024-01-15T14:30:00Z",
        updated_at="2024-01-15T14:30:00Z",
    )
    defaults.update(kwargs)
    return DiaryEntry(**defaults)


def make_mock_diary_service():
    from app.services.diary_service import DiaryService
    svc = MagicMock(spec=DiaryService)
    svc.create = AsyncMock(return_value=make_diary_entry())
    svc.list = AsyncMock(return_value=[make_diary_entry()])
    svc.update = AsyncMock(return_value=make_diary_entry())
    svc.delete = AsyncMock(
        side_effect=PermissionError("Sem permissão para modificar esta anotação.")
    )
    svc.search = AsyncMock(return_value=[make_diary_entry()])
    return svc


def make_mock_user_repo():
    repo = MagicMock()
    repo.get_preferences = AsyncMock(return_value=UserPreferences(formalidade="media", nome_referencia="Teste"))
    return repo


def make_mock_chat_service(raise_503=False, raise_400=False):
    from app.services.chat_service import ChatService
    svc = MagicMock(spec=ChatService)
    if raise_503:
        svc.send = AsyncMock(side_effect=LLMProviderError("LLM down"))
    elif raise_400:
        svc.send = AsyncMock(side_effect=ValueError("Limite de 20 mensagens"))
    else:
        svc.send = AsyncMock(return_value=ChatResponse(
            response="ok",
            mode="PADRAO",
            blocked=False,
            conversation_id="conv-uuid",
            message_count=1,
        ))
    return svc


@pytest.fixture
def mock_supabase():
    return make_mock_supabase()


@pytest.fixture
async def client():
    """Default client: diary OK, chat raises 503 (for test_chat_returns_503)."""
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_diary_service] = lambda: make_mock_diary_service()
    app.dependency_overrides[get_chat_service] = lambda: make_mock_chat_service(raise_503=True)
    app.dependency_overrides[get_user_repo] = lambda: make_mock_user_repo()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def client_chat_ok():
    """Client where chat succeeds."""
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_diary_service] = lambda: make_mock_diary_service()
    app.dependency_overrides[get_chat_service] = lambda: make_mock_chat_service()
    app.dependency_overrides[get_user_repo] = lambda: make_mock_user_repo()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def client_chat_limit():
    """Client where chat raises 400 (limit exceeded)."""
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_chat_service] = lambda: make_mock_chat_service(raise_400=True)
    app.dependency_overrides[get_user_repo] = lambda: make_mock_user_repo()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


def make_mock_history_service():
    from app.services.history_service import HistoryService
    svc = MagicMock(spec=HistoryService)
    svc.list_unified = AsyncMock(return_value=HistoryResponse(
        items=[
            HistoryItem(id="c1", type="conversation", preview="conversa", created_at=datetime.now(), item_count=3),
            HistoryItem(id="d1", type="diary", preview="diário", created_at=datetime.now(), item_count=5),
        ],
        total=2, page=1, page_size=20, has_more=False,
    ))
    return svc


@pytest.fixture
async def client_history_ok():
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_history_service] = lambda: make_mock_history_service()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


def make_mock_task_service():
    from app.services.task_service import TaskService
    svc = MagicMock(spec=TaskService)
    svc.create = AsyncMock(return_value=Task(
        id="task-uuid", user_id="test-user-1", title="", status="pending", due_date=None,
    ))

    async def create_with_title(user_id, title):
        return Task(id="task-uuid", user_id=user_id, title=title, status="pending", due_date=None)

    svc.create.side_effect = create_with_title
    return svc


@pytest.fixture
async def client_tasks_ok():
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_task_service] = lambda: make_mock_task_service()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


def make_mock_user_service(wrong_password=False):
    from app.services.user_service import UserService
    svc = MagicMock(spec=UserService)
    svc.update_preferences = AsyncMock(return_value=UserPreferences(
        formalidade="alta", nome_referencia="Edu", theme=None,
    ))

    async def update_prefs(user_id, formalidade=None, nome_referencia=None, theme=None):
        return UserPreferences(
            formalidade=formalidade or "alta",
            nome_referencia=nome_referencia or "Edu",
            theme=theme,
        )
    svc.update_preferences.side_effect = update_prefs
    svc.get_preferences = AsyncMock(return_value=UserPreferences(formalidade="baixa", nome_referencia="Edu", theme="dark"))

    if wrong_password:
        svc.change_password = AsyncMock(side_effect=PermissionError("Senha atual incorreta."))
    else:
        svc.change_password = AsyncMock(return_value=None)
    return svc


@pytest.fixture
async def client_settings_ok():
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_user_service] = lambda: make_mock_user_service()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def client_settings_wrong_pw():
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_user_service] = lambda: make_mock_user_service(wrong_password=True)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test-token-user-1"}


@pytest.fixture
def auth_headers_user2():
    return {"Authorization": "Bearer test-token-user-2"}


# ── ROUTINES FIXTURES ──────────────────────────────────────────────────────────

def make_mock_routine_service(not_found=False):
    from app.services.routine_service import RoutineService
    svc = MagicMock(spec=RoutineService)

    sample = Routine(
        id="r-uuid", user_id="user-1", nome="Manhã saudável",
        atividades=["Água", "Meditação"], periodo="manha",
        created_at="2024-01-01T00:00:00Z", updated_at="2024-01-01T00:00:00Z",
    )

    svc.list = AsyncMock(return_value=[sample])
    svc.create = AsyncMock(return_value=sample)

    if not_found:
        svc.delete = AsyncMock(side_effect=KeyError("Rotina não encontrada."))
        svc.update = AsyncMock(side_effect=KeyError("Rotina não encontrada."))
    else:
        svc.delete = AsyncMock(return_value=True)
        svc.update = AsyncMock(return_value=sample)

    return svc


@pytest.fixture
async def client_routines_ok():
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_routine_service] = lambda: make_mock_routine_service()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def client_routines_not_found():
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_routine_service] = lambda: make_mock_routine_service(not_found=True)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── MEMORIES FIXTURES ──────────────────────────────────────────────────────────

def make_mock_memory_service(not_found=False):
    from app.services.memory_service import MemoryService
    svc = MagicMock(spec=MemoryService)

    sample = Memory(
        id="m-uuid", user_id="user-1",
        conteudo="Prefere emails curtos", tipo="PREFERENCIA",
        created_at="2024-01-01T00:00:00Z",
    )

    svc.list = AsyncMock(return_value=[sample])
    svc.create = AsyncMock(return_value=sample)

    if not_found:
        svc.delete = AsyncMock(side_effect=KeyError("Memória não encontrada."))
    else:
        svc.delete = AsyncMock(return_value=True)

    return svc


@pytest.fixture
async def client_memories_ok():
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_memory_service] = lambda: make_mock_memory_service()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def client_memories_not_found():
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_memory_service] = lambda: make_mock_memory_service(not_found=True)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
