# Padrão de Testes — Shello

> TDD é **obrigatório** no projeto. Este documento define como escrever, organizar e executar testes.
> Código de produção sem um teste falhando escrito antes é considerado violação do processo.

---

## Filosofia: TDD Estrito

O ciclo obrigatório é **Red → Green → Refactor**:

1. **Red:** Escreva um teste que descreve o comportamento desejado. Rode — ele **deve falhar**.
2. **Green:** Escreva o mínimo de código de produção para o teste passar.
3. **Refactor:** Melhore o código (sem quebrar o teste).

```
❌ Proibido: escrever código de produção sem um teste falhando primeiro.
✅ Correto: teste falha → implementação → teste passa → refatorar.
```

---

## Stack de Testes

| Ferramenta | Finalidade |
|---|---|
| `pytest` | Framework principal de testes |
| `pytest-asyncio` | Suporte a funções `async def` em testes |
| `httpx` | Cliente HTTP para testes de integração (ASGI) |
| `pytest-mock` | Mocking via `mocker` fixture |

---

## Estrutura de Diretórios

Os testes espelham a estrutura de `app/`:

```
backend/
├── app/
│   ├── routers/
│   │   ├── diary.py
│   │   └── chat.py
│   ├── services/
│   │   ├── diary_service.py
│   │   └── chat_service.py
│   └── repositories/
│       └── diary_repository.py
└── tests/
    ├── conftest.py           ← fixtures compartilhadas
    ├── routers/
    │   ├── test_diary.py     ← testes de integração (controller)
    │   └── test_chat.py
    ├── services/
    │   ├── test_diary_service.py   ← testes unitários
    │   └── test_chat_service.py
    └── repositories/
        └── test_diary_repository.py
```

### Nomenclatura de arquivos
- Sempre `test_[módulo].py` — ex.: `test_diary_service.py`, `test_chat.py`.

---

## Cobertura Mínima Exigida

| Camada | Requisito mínimo |
|---|---|
| Service | ≥ 3 testes unitários por service |
| Controller (Router) | ≥ 1 teste de integração por endpoint |
| Repository | ≥ 1 teste por método público (com Supabase mockado) |

---

## `conftest.py` — Fixtures Compartilhadas

```python
# backend/tests/conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock
from app.main import app
from app.dependencies import get_supabase_client, get_current_user

@pytest.fixture
def mock_supabase():
    """Retorna um mock do cliente Supabase."""
    client = MagicMock()
    # Configura a chain de chamadas mais comum
    client.table.return_value.insert.return_value.execute.return_value.data = []
    client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None
    return client

@pytest.fixture
def mock_current_user():
    """Usuário autenticado padrão para testes."""
    return {"id": "user-test-uuid-123", "email": "test@example.com"}

@pytest.fixture
async def async_client(mock_supabase, mock_current_user):
    """
    Cliente HTTP assíncrono com dependências mockadas.
    Usar para testes de integração de controllers.
    """
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase
    app.dependency_overrides[get_current_user] = lambda: mock_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

    app.dependency_overrides.clear()
```

---

## Como Mockar Dependências Externas

### Mockando Supabase

```python
# tests/services/test_diary_service.py
import pytest
from unittest.mock import MagicMock, AsyncMock
from app.services.diary_service import DiaryService
from app.repositories.diary_repository import DiaryRepository

@pytest.fixture
def mock_repo():
    repo = MagicMock(spec=DiaryRepository)
    repo.create = AsyncMock(return_value={
        "id": "entry-uuid-456",
        "user_id": "user-test-uuid-123",
        "content": "Conteúdo de teste",
        "created_at": "2026-01-01T00:00:00Z",
    })
    return repo

@pytest.fixture
def service(mock_repo):
    return DiaryService(repo=mock_repo)
```

### Mockando OpenAI

```python
# tests/services/test_chat_service.py
import pytest
from unittest.mock import AsyncMock, patch

@pytest.fixture
def mock_openai_response():
    response = MagicMock()
    response.choices[0].message.content = "Olá! Como posso ajudar?"
    response.usage.prompt_tokens = 150
    response.usage.completion_tokens = 30
    return response

@pytest.fixture
def mock_openai(mock_openai_response):
    with patch("app.services.chat_service.openai_client.chat.completions.create",
               new_callable=AsyncMock,
               return_value=mock_openai_response) as mock:
        yield mock
```

---

## Exemplos de Testes

### Teste Unitário de Service

```python
# tests/services/test_diary_service.py
import pytest

@pytest.mark.asyncio
async def test_create_entry_rejects_empty_content(service):
    """Regra: conteúdo vazio retorna ValueError."""
    with pytest.raises(ValueError, match="vazio"):
        await service.create_entry(user_id="user-123", content="")

@pytest.mark.asyncio
async def test_create_entry_rejects_content_over_10k_chars(service):
    """Regra: conteúdo > 10.000 chars retorna ValueError."""
    long_content = "a" * 10_001
    with pytest.raises(ValueError, match="10.000"):
        await service.create_entry(user_id="user-123", content=long_content)

@pytest.mark.asyncio
async def test_create_entry_saves_valid_content(service, mock_repo):
    """Caso feliz: anotação válida é salva e retornada."""
    content = "Uma anotação válida e curta."
    result = await service.create_entry(user_id="user-123", content=content)

    mock_repo.create.assert_called_once_with(user_id="user-123", content=content)
    assert result["id"] == "entry-uuid-456"
```

### Teste de Integração de Controller

```python
# tests/routers/test_diary.py
import pytest

@pytest.mark.asyncio
async def test_create_entry_returns_201(async_client, mock_repo):
    """Integração: POST /api/diary/ retorna 201 com dados da entry."""
    mock_repo.create.return_value = {
        "id": "new-entry-uuid",
        "content": "Minha anotação de teste",
        "user_id": "user-test-uuid-123",
        "created_at": "2026-01-01T10:00:00Z",
    }

    response = await async_client.post(
        "/api/diary/",
        json={"content": "Minha anotação de teste"},
    )

    assert response.status_code == 201
    assert response.json()["id"] == "new-entry-uuid"

@pytest.mark.asyncio
async def test_create_entry_returns_422_for_empty_content(async_client):
    """Integração: POST /api/diary/ com conteúdo vazio retorna 422."""
    response = await async_client.post("/api/diary/", json={"content": ""})
    assert response.status_code == 422
```

---

## Executando os Testes

```bash
# Todos os testes
pytest backend/tests/

# Apenas testes unitários de services
pytest backend/tests/services/ -v

# Apenas testes de integração de routers
pytest backend/tests/routers/ -v

# Com cobertura (requer pytest-cov)
pytest backend/tests/ --cov=app --cov-report=term-missing

# Rodar um teste específico
pytest backend/tests/services/test_diary_service.py::test_create_entry_rejects_empty_content -v
```

---

## Regras Adicionais

- **Nunca** usar `time.sleep()` em testes — use mocks de tempo se necessário.
- **Nunca** fazer chamadas reais à OpenAI ou ao Supabase em testes unitários — sempre mockar.
- Testes de integração também usam Supabase mockado via `dependency_overrides`.
- Fixtures de dados de teste devem ser realistas (UUIDs, timestamps válidos, etc.).
