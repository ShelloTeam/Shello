# agents.md — Tests

> **Módulo:** `backend/tests/`
> **Stack:** pytest + pytest-asyncio + httpx `AsyncClient`
> **Total:** 86 testes em 9 arquivos
> **Regra:** Supabase e OpenAI são **sempre** mockados em testes unitários/integração.

---

## Como rodar os testes

```bash
# A partir de backend/
cd backend

# Todos os testes
pytest tests/ -v

# Arquivo específico
pytest tests/test_chat.py -v

# Teste específico
pytest tests/test_chat.py::test_send_message_success -v

# Com cobertura
pytest tests/ --cov=app --cov-report=term-missing

# Via Docker (sem dependências locais)
docker build -f Dockerfile.test -t shello-test .
docker run --rm shello-test
```

**`pytest.ini` (na raiz de `backend/`):**
```ini
[pytest]
asyncio_mode = auto
```

- `asyncio_mode = auto` significa que **todos os testes async são detectados automaticamente** — não precisa de `@pytest.mark.asyncio` em cada um.

---

## Estrutura dos arquivos de teste

Os testes espelham a estrutura de `app/`:

| Arquivo de teste | O que testa | Fixtures principais usadas |
|---|---|---|
| `test_chat.py` | `ChatService` + endpoint `/api/chat` | `client`, `client_chat_ok`, `client_chat_limit`, `auth_headers` |
| `test_diary.py` | `DiaryService` + endpoint `/api/diary` | `client`, `auth_headers` |
| `test_history.py` | `HistoryService` + endpoint `/api/history` | `client_history_ok`, `auth_headers` |
| `test_tasks_from_chat.py` | Criação de tarefas via chat com `due_date=None` | `client_tasks_ok`, `auth_headers` |
| `test_user_settings.py` | Preferências e senha via `/api/user` | `client_settings_ok`, `client_settings_wrong_pw`, `auth_headers` |
| `test_cost_tracker.py` | `CostTracker.calculate_cost()` (puro) | Nenhuma (sem I/O) |
| `test_extraction.py` | `ExtractionService` com LLM mockado | Mock direto de `LLMProvider` |
| `test_llm_provider.py` | `OpenAIProvider.generate()` e `moderate()` | Mock do cliente AsyncOpenAI |
| `test_rls.py` | `RLSValidator.validate_all()` | `mock_supabase` |

---

## Fixtures disponíveis no `conftest.py`

### Fixtures de cliente HTTP

Todas as fixtures de cliente configuram `app.dependency_overrides` antes do yield e limpam depois.

| Fixture | Chat Service | Diary Service | Task Service | User Service |
|---|---|---|---|---|
| `client` | Raises 503 (LLM down) | OK | — | — |
| `client_chat_ok` | OK | OK | — | — |
| `client_chat_limit` | Raises 400 (limite) | — | — | — |
| `client_history_ok` | — | — | — | — |
| `client_tasks_ok` | — | — | OK | — |
| `client_settings_ok` | — | — | — | OK |
| `client_settings_wrong_pw` | — | — | — | Wrong password |

### Fixtures de autenticação

```python
auth_headers          # {"Authorization": "Bearer test-token-user-1"} → user-1
auth_headers_user2    # {"Authorization": "Bearer test-token-user-2"} → user-2
mock_supabase         # MagicMock com .table(), .select(), .eq(), .execute() encadeados
```

### Funções helper (não são fixtures — chamadas diretamente)

```python
make_mock_supabase()         # → MagicMock do cliente Supabase
make_diary_entry(**kwargs)   # → DiaryEntry com valores default sobrescritíveis
make_mock_diary_service()    # → MagicMock(spec=DiaryService) com AsyncMocks
make_mock_chat_service(raise_503=False, raise_400=False)  # → MagicMock(spec=ChatService)
make_mock_history_service()  # → MagicMock(spec=HistoryService)
make_mock_task_service()     # → MagicMock(spec=TaskService) com side_effect de título
make_mock_user_service(wrong_password=False)  # → MagicMock(spec=UserService)
```

---

## Como criar um novo teste

### 1. Convenção de nomenclatura

- Arquivo: `test_<dominio>.py` (ex: `test_routines.py`)
- Função: `test_<ação>_<cenário>` (ex: `test_create_routine_success`, `test_create_routine_empty_title`)

### 2. Estrutura de um teste de endpoint (integração)

```python
import pytest


@pytest.mark.asyncio  # opcional com asyncio_mode=auto
async def test_create_routine_success(client_routines_ok, auth_headers):
    response = await client_routines_ok.post(
        "/api/routines",
        json={"title": "Acordar cedo", "time": "06:00"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Acordar cedo"


async def test_create_routine_unauthorized(client_routines_ok):
    response = await client_routines_ok.post(
        "/api/routines",
        json={"title": "Rotina"},
        # sem headers → 401
    )
    assert response.status_code == 401
```

### 3. Estrutura de um teste unitário de Service

```python
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.routine_service import RoutineService
from app.repositories.routine_repository import RoutineRepository


async def test_create_routine_empty_title():
    mock_repo = MagicMock(spec=RoutineRepository)
    service = RoutineService(repository=mock_repo)

    with pytest.raises(ValueError, match="Título não pode ser vazio"):
        await service.create(user_id="user-1", title="")

    mock_repo.create.assert_not_called()  # garantir que não foi ao banco
```

### 4. Adicionando fixture de cliente para o novo domínio

```python
# Em conftest.py — adicione a função helper:
def make_mock_routine_service():
    from app.services.routine_service import RoutineService
    svc = MagicMock(spec=RoutineService)
    svc.create = AsyncMock(return_value={"id": "r-uuid", "title": "Rotina", "user_id": "user-1"})
    return svc

# Adicione a fixture:
@pytest.fixture
async def client_routines_ok():
    from app.controllers.routines_controller import get_routine_service
    app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
    app.dependency_overrides[get_routine_service] = lambda: make_mock_routine_service()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

---

## Mock de Supabase

```python
from unittest.mock import MagicMock

def make_mock_supabase():
    db = MagicMock()
    db.table = MagicMock(return_value=db)
    db.select = MagicMock(return_value=db)
    db.insert = MagicMock(return_value=db)
    db.update = MagicMock(return_value=db)
    db.delete = MagicMock(return_value=db)
    db.eq = MagicMock(return_value=db)
    db.neq = MagicMock(return_value=db)
    db.order = MagicMock(return_value=db)
    db.limit = MagicMock(return_value=db)
    db.single = MagicMock(return_value=db)
    db.ilike = MagicMock(return_value=db)
    db.lt = MagicMock(return_value=db)
    db.execute = MagicMock(return_value=MagicMock(data=[]))
    return db

# Para simular dados retornados:
db.execute = MagicMock(return_value=MagicMock(data=[
    {"id": "task-1", "user_id": "user-1", "title": "Tarefa", "status": "pending", "due_date": None}
]))
```

**Padrão de substituição em fixtures:**
```python
app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
```

---

## Mock de OpenAI / LLM

### Via `MagicMock(spec=LLMProvider)` (para testes de Service)

```python
from unittest.mock import AsyncMock, MagicMock
from app.core.llm.base import LLMProvider

mock_llm = MagicMock(spec=LLMProvider)
mock_llm.generate = AsyncMock(return_value="Resposta do agente")
mock_llm.moderate = AsyncMock(return_value=True)  # True = seguro

# Simular LLM indisponível:
mock_llm.generate = AsyncMock(side_effect=LLMProviderError("API down"))
```

### Via `patch` do AsyncOpenAI (para testes do provider)

```python
from unittest.mock import patch, AsyncMock, MagicMock

async def test_generate_success():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices[0].message.content = "Resposta mock"
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch("app.core.llm.openai_provider.AsyncOpenAI", return_value=mock_client):
        from app.core.llm.openai_provider import OpenAIProvider
        provider = OpenAIProvider(api_key="fake-key")
        result = await provider.generate("system", [], "mensagem")
    
    assert result == "Resposta mock"
```

### Via `dependency_overrides` (para testes de Controller/integração)

```python
# O make_mock_chat_service já configura um mock_llm interno:
app.dependency_overrides[get_chat_service] = lambda: make_mock_chat_service()
# ChatService nunca é chamado de verdade — o mock responde diretamente
```

---

## Tokens de autenticação nos testes

```python
# Mapeamento em dependencies.py (apenas em testes)
"test-token"          → user-1
"test-token-user-1"   → user-1
"test-token-user-2"   → user-2

# Uso nos testes:
headers = {"Authorization": "Bearer test-token-user-1"}
response = await client.get("/api/diary", headers=headers)
```

Para autenticar como um usuário diferente em testes de isolamento:
```python
async def test_cannot_delete_other_users_entry(client, auth_headers, auth_headers_user2):
    # user-2 tenta deletar entrada de user-1
    response = await client.delete("/api/diary/entry-1", headers=auth_headers_user2)
    assert response.status_code == 403
```

---

## Padrão de asserção

```python
# Status HTTP
assert response.status_code == 200
assert response.status_code == 201
assert response.status_code == 400
assert response.status_code == 401
assert response.status_code == 403
assert response.status_code == 503

# Corpo da resposta
data = response.json()
assert data["id"] == "expected-uuid"
assert data["title"] == "Tarefa"
assert data["due_date"] is None

# Campos presentes
assert "conversation_id" in data
assert "message_count" in data

# Mock chamado corretamente
service_mock.create.assert_called_once_with(user_id="user-1", title="Tarefa")
service_mock.create.assert_not_called()
```

---

## Anti-patterns — nunca faça isso

```python
# ❌ Usar cliente Supabase real em testes unitários
def test_create_task():
    repo = TaskRepository()   # ← vai chamar Supabase real — não mockável, não confiável

# ❌ Testar sem limpar os overrides
app.dependency_overrides[get_supabase] = lambda: mock_db
# ... sem app.dependency_overrides.clear() → vaza para outros testes

# ❌ Não usar spec= no MagicMock
svc = MagicMock()             # ← sem spec, qualquer atributo é válido — erros de typo passam
svc = MagicMock(spec=TaskService)  # ← correto: só aceita métodos reais

# ❌ Testes não-async para funções async
def test_send_message():      # ← deve ser "async def test_send_message():"
    result = chat_service.send(...)

# ❌ Hard-code de IDs de usuário sem usar auth_headers fixture
headers = {"Authorization": "Bearer qualquer-coisa"}   # ← use as fixtures auth_headers / auth_headers_user2
```
