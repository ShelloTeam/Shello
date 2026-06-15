# agents.md — Controllers

> **Módulo:** `backend/app/controllers/`
> **Papel:** Camada HTTP — recebe requisições, chama Services, retorna respostas. **Zero lógica de negócio.**

---

## O que é um Controller

Controllers são arquivos FastAPI com `APIRouter`. Cada controller corresponde a um domínio funcional e expõe endpoints REST. Sua única responsabilidade é:

1. Receber e validar a entrada HTTP (body, path params, headers)
2. Resolver dependências via `Depends()`
3. Delegar ao Service correspondente
4. Mapear exceções do Service para status HTTP corretos
5. Retornar o `response_model`

**Um controller NUNCA deve:**
- Acessar o banco de dados diretamente
- Conter `if`/`else` de regras de negócio
- Instanciar repositories
- Chamar o LLM

---

## Controllers existentes

| Arquivo | Prefixo | Tag Swagger | Descrição |
|---|---|---|---|
| `chat_controller.py` | `/api/chat` | `Chat` | Envio de mensagens ao agente Shello |
| `diary_controller.py` | `/api/diary` | `Diário` | CRUD de anotações do diário pessoal |
| `history_controller.py` | `/api/history` | `Histórico` | Listagem unificada de conversas + diário |
| `memories_controller.py` | `/api/memories` | `Contexto` | Fragmentos de contexto/memórias |
| `onboarding_controller.py` | `/api/onboarding` | `Configurações` | Status e respostas do onboarding |
| `routines_controller.py` | `/api/routines` | `Configurações` | CRUD de rotinas |
| `tasks_controller.py` | `/api/tasks` | `Tarefas` | CRUD de tarefas |
| `user_controller.py` | `/api/user` | `Configurações` | Preferências e senha do usuário |

---

## Tags Swagger obrigatórias

Todos os endpoints devem usar uma dessas tags (define o agrupamento no `/docs`):

| Tag | Usado em |
|---|---|
| `Auth` | Rotas de autenticação (em `api/v1/`) |
| `Diário` | `diary_controller.py` |
| `Tarefas` | `tasks_controller.py` |
| `Chat` | `chat_controller.py` |
| `Contexto` | `memories_controller.py` |
| `Configurações` | `user_controller.py`, `routines_controller.py`, `onboarding_controller.py` |
| `Histórico` | `history_controller.py` |
| `Admin` | Endpoints internos (RLS validator, scheduler) |

---

## Padrão de injeção de dependência

Toda dependência é declarada como uma função factory e injetada via `Depends()`.

```python
# ✅ Padrão correto
def get_task_service(db=Depends(get_supabase)) -> TaskService:
    repo = TaskRepository(db=db)
    return TaskService(repository=repo)

@router.post("", response_model=TaskResponse)
async def create_task(
    body: TaskCreate,
    current_user: User = Depends(get_current_user),   # autenticação
    service: TaskService = Depends(get_task_service), # lógica
):
    ...
```

**Regras de injeção:**
- `get_current_user` → sempre presente nos endpoints protegidos (vem de `app.core.dependencies`)
- `get_supabase` → injetado na factory do service/repository — **nunca diretamente no endpoint**
- Factories locais ao controller devem ter nomes `get_<nome>_service` para poder ser sobrescritas nos testes via `app.dependency_overrides`

---

## Como documentar endpoints

Todos os endpoints devem incluir `summary`, `description` e `responses`:

```python
@router.post(
    "",
    response_model=TaskResponse,
    summary="Criar tarefa",
    description="""
Cria uma nova tarefa para o usuário autenticado.

**Autenticação:** Bearer token JWT obrigatório no header `Authorization`.
**due_date:** Opcional. Formato ISO 8601. Pode ser `null` — o agente chat cria tarefas sem data.
""",
    responses={
        401: {"description": "Token JWT ausente ou inválido"},
        422: {"description": "Body inválido (título ausente, etc.)"},
    },
)
```

---

## Exemplo de controller correto

```python
from fastapi import APIRouter, Depends, HTTPException
from app.models.task_models import TaskCreate, TaskResponse
from app.services.task_service import TaskService
from app.repositories.task_repository import TaskRepository
from app.core.dependencies import get_current_user, get_supabase, User

router = APIRouter(prefix="/api/tasks", tags=["Tarefas"])


def get_task_service(db=Depends(get_supabase)) -> TaskService:
    return TaskService(repository=TaskRepository(db=db))


@router.post(
    "",
    response_model=TaskResponse,
    summary="Criar tarefa",
    description="Cria tarefa para o usuário autenticado. due_date é opcional.",
    responses={401: {"description": "Não autenticado"}},
)
async def create_task(
    body: TaskCreate,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    try:
        return await service.create(
            user_id=current_user.id,
            title=body.title,
            due_date=body.due_date,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
```

---

## Mapeamento de exceções → HTTP

| Exceção do Service | Status HTTP |
|---|---|
| `ValueError` | `400 Bad Request` |
| `PermissionError` | `403 Forbidden` |
| `LLMProviderError` | `503 Service Unavailable` |
| `KeyError` / `RuntimeError` | `500 Internal Server Error` |
| Ausência de token | `401 Unauthorized` (tratado por `get_current_user`) |

---

## Como criar um novo controller

1. Crie `backend/app/controllers/<dominio>_controller.py`
2. Instancie `router = APIRouter(prefix="/api/<dominio>", tags=["<Tag>"])`
3. Defina a factory `get_<dominio>_service()` com `Depends(get_supabase)`
4. Implemente os endpoints com `summary`, `description`, `responses` e `response_model`
5. Registre o router em `backend/app/main.py`:
   ```python
   from app.controllers.novo_controller import router as novo_router
   app.include_router(novo_router)
   ```
6. Adicione a factory ao `conftest.py` do `tests/` para permitir override nos testes

---

## Anti-patterns — nunca faça isso

```python
# ❌ Lógica de negócio no controller
@router.post("")
async def create_task(body: TaskCreate, ...):
    if body.title == "":          # ← regra de negócio — vai para o Service
        raise HTTPException(...)

# ❌ Acesso direto ao banco
@router.get("/{id}")
async def get_task(id: str, db=Depends(get_supabase)):
    result = db.table("tasks").select("*").eq("id", id).execute()  # ← vai para Repository

# ❌ Factory sem Depends(get_supabase) — impossível de mockar em testes
def get_task_service() -> TaskService:
    db = create_client(...)       # ← instância hardcoded, inquebrável em testes
    return TaskService(TaskRepository(db))

# ❌ Tag Swagger ausente
router = APIRouter(prefix="/api/tasks")  # ← sem tags=[...]
```
