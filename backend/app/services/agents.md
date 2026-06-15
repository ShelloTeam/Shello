# agents.md — Services

> **Módulo:** `backend/app/services/`
> **Papel:** Lógica de negócio pura. Orquestra Repositories + LLM. **Nunca acessa o banco diretamente.**

---

## O que é um Service

Services contêm toda a lógica de negócio da aplicação. Eles:

- Recebem dados limpos (já validados pelo controller)
- Aplicam regras de negócio (limites, validações semânticas, ownership)
- Orquestram chamadas a um ou mais Repositories
- Chamam o LLM via `LLMProvider` quando necessário
- São completamente testáveis sem banco real (apenas mocks de repository)

**Um service NUNCA deve:**
- Importar `supabase` ou chamar `db.table(...)` diretamente
- Conhecer HTTPException ou status codes HTTP
- Instanciar seus próprios repositories (recebe via `__init__`)

---

## Services existentes

| Arquivo | Responsabilidade principal |
|---|---|
| `auth_service.py` | Registro, login, reset de senha, hashing de senha |
| `chat_service.py` | Orquestra conversa: limite, contexto, modo, LLM, moderação, persistência |
| `context_fragment_service.py` | CRUD de fragmentos de contexto/memórias do agente |
| `diary_service.py` | CRUD de anotações + extração assíncrona de contexto |
| `extraction_service.py` | Extrai fragmentos de contexto de texto via LLM |
| `history_service.py` | Lista unificada de conversas + entradas de diário |
| `memory_service.py` | Listagem de memórias ativas do usuário |
| `mode_detection.py` | Detecta modo PRATICO/PADRAO por keywords (função standalone) |
| `onboarding_service.py` | Status e conclusão do onboarding |
| `routine_service.py` | CRUD de rotinas |
| `task_service.py` | CRUD de tarefas + criação via chat (due_date opcional) |
| `user_service.py` | Preferências do usuário e troca de senha |

---

## Regras de negócio críticas

### 1. Limite de mensagens por conversa (`chat_service.py`)

```python
MESSAGE_LIMIT = 200  # constante no topo do arquivo

if conversation.message_count >= MESSAGE_LIMIT:
    raise ValueError(f"Limite de {MESSAGE_LIMIT} mensagens atingido. Inicie uma nova conversa.")
```

- O limite atual no código é **200** (não 20 como pode aparecer em docs antigos)
- A exceção é `ValueError` — o controller converte para HTTP 400
- A verificação acontece **antes** de qualquer chamada ao LLM

### 2. Extração assíncrona do diário (`diary_service.py`)

```python
# Extração NÃO bloqueia a resposta ao usuário
if len(content) > 100:
    asyncio.create_task(
        self.extraction_service.extract_from_diary(entry.id, content, user_id)
    )
return entry  # retorna imediatamente
```

- `asyncio.create_task()` dispara a extração em background — a entrada do diário já está salva
- Conteúdos com ≤ 100 chars **não disparam** extração (muito curtos para gerar fragmentos úteis)
- Falha na extração **não** propaga para o usuário

### 3. `due_date` nulo em tarefas criadas via chat (`task_service.py`)

- Quando o agente cria uma tarefa conversacionalmente, `due_date` **deve aceitar `None`**
- O repository usa `{k: v for k, v in payload.items() if v is not None}` para omitir o campo
- Nunca forçar `due_date` default no service — deixar o banco usar o valor default da coluna

### 4. Verificação de ownership (`diary_service.py`, `task_service.py`)

```python
async def _assert_owner(self, entry_id: str, user_id: str) -> None:
    entry = await self.repository.get_by_id(entry_id)
    if entry is None or entry.user_id != user_id:
        raise PermissionError("Sem permissão para modificar esta anotação.")
```

- **Sempre** verificar ownership antes de update/delete, mesmo com RLS ativo no Supabase
- RLS é a segunda barreira — a primeira é o `user_id` no filtro da query
- Lançar `PermissionError` (não `ValueError`) — controller mapeia para HTTP 403

### 5. Moderação antes de persistir (`chat_service.py`)

```python
is_safe = await self.llm_provider.moderate(llm_response)
if not is_safe:
    return ChatResponse(response="Resposta bloqueada pela moderação.", blocked=True, ...)

# Só persiste se passou na moderação
await self.chat_repository.save_message(...)
```

---

## Estrutura padrão de um Service

```python
from __future__ import annotations
from app.repositories.exemplo_repository import ExemploRepository


class ExemploService:
    """
    Docstring: o que orquestra e quais regras aplica.

    Raises:
        ValueError: Para dados inválidos.
        PermissionError: Para acessos não autorizados.
    """

    def __init__(self, repository: ExemploRepository):
        self.repository = repository

    async def create(self, user_id: str, data: str) -> dict:
        if not data.strip():
            raise ValueError("Dado não pode ser vazio.")
        return await self.repository.create(user_id=user_id, data=data)
```

---

## Como criar um novo Service

1. Crie `backend/app/services/<dominio>_service.py`
2. O `__init__` recebe apenas repositories e providers (sem `db` diretamente)
3. Implemente métodos async para cada operação
4. Use `raise ValueError` para validações de negócio, `raise PermissionError` para ownership
5. Adicione ao controller correspondente via factory com `Depends()`

---

## Como mockar nos testes

Use `MagicMock(spec=NomeDoService)` + `AsyncMock` para métodos async:

```python
from unittest.mock import MagicMock, AsyncMock
from app.services.task_service import TaskService
from app.models.task_models import Task

def make_mock_task_service() -> MagicMock:
    svc = MagicMock(spec=TaskService)
    svc.create = AsyncMock(return_value=Task(
        id="task-uuid",
        user_id="user-1",
        title="Tarefa teste",
        status="pending",
        due_date=None,
    ))
    return svc

# No conftest.py / fixture:
app.dependency_overrides[get_task_service] = lambda: make_mock_task_service()
```

**Para simular erros:**
```python
svc.create = AsyncMock(side_effect=ValueError("Título não pode ser vazio."))
svc.update = AsyncMock(side_effect=PermissionError("Sem permissão."))
```

---

## Anti-patterns — nunca faça isso

```python
# ❌ Acesso direto ao banco no service
class TaskService:
    def __init__(self):
        self.db = create_client(...)          # ← não — recebe repository no __init__
    
    async def create(self, ...):
        self.db.table("tasks").insert(...)    # ← não — responsabilidade do repository

# ❌ Conhecer HTTP no service
async def create(self, ...):
    raise HTTPException(status_code=400)     # ← não — raise ValueError ao invés

# ❌ Extração síncrona que bloqueia a resposta
await self.extraction_service.extract(...)   # ← use asyncio.create_task() para não bloquear

# ❌ Persistir mensagem antes da moderação
await self.chat_repository.save_message(...) # ← só persistir após is_safe == True
await self.llm_provider.moderate(...)
```
