# agents.md — Repositories

> **Módulo:** `backend/app/repositories/`
> **Papel:** Única camada que fala com o Supabase. Executa queries. **Zero regras de negócio.**

---

## O que é um Repository

Repositories encapsulam todo o acesso ao banco de dados Supabase. Eles:

- Recebem o cliente Supabase (`db`) via `__init__`
- Executam queries usando o Supabase Python SDK
- Retornam tipos Python simples (`dict`, `list[dict]`, `None`) ou modelos Pydantic
- Lançam exceções genéricas (`RuntimeError`) em caso de falha de infra

**Um repository NUNCA deve:**
- Conter lógica de negócio (validações, regras de ownership)
- Chamar outros repositories
- Chamar o LLM
- Conhecer HTTPException

---

## Repositories existentes

| Arquivo | Tabelas principais | Observações |
|---|---|---|
| `chat_repository.py` | `conversations`, `messages` | Recebe `db` via `__init__` (injetável) |
| `context_fragment_repository.py` | `context_fragments` | Busca por categoria e status ativo |
| `context_repository.py` | `context_fragments` | Interface simplificada para fragments ativos |
| `diary_repository.py` | `diary_entries` | ILIKE para search, paginação manual |
| `history_repository.py` | `conversations`, `diary_entries` | Listagem unificada para o History endpoint |
| `onboarding_repository.py` | `onboarding_answers` | Instancia o próprio cliente (padrão legado) |
| `routine_repository.py` | `routines` | Instancia o próprio cliente (padrão legado) |
| `task_repository.py` | `tasks` | Instancia o próprio cliente (padrão legado) |
| `user_repository.py` | `users` | Instancia o próprio cliente (padrão legado) |

> **Nota sobre padrões:** Alguns repositories mais antigos (`task_repository`, `user_repository`, etc.) instanciam o cliente Supabase internamente via `get_settings()`. Os mais novos (`chat_repository`, `context_repository`) recebem `db` via `__init__`. **Ao criar novos repositories, use o padrão de injeção** (recebe `db`).

---

## Tabelas Supabase existentes

| Tabela | Colunas principais | RLS |
|---|---|---|
| `users` | `id`, `email`, `password_hash`, `nome_referencia`, `formalidade`, `theme`, `created_at` | ✅ |
| `diary_entries` | `id`, `user_id`, `content`, `created_at`, `updated_at` | ✅ |
| `tasks` | `id`, `user_id`, `title`, `description`, `due_date`, `status`, `created_at`, `updated_at` | ✅ |
| `conversations` | `id`, `user_id`, `message_count`, `status`, `created_at`, `updated_at` | ✅ |
| `messages` | `id`, `conversation_id`, `user_id`, `role`, `content`, `created_at` | ✅ |
| `context_fragments` | `id`, `user_id`, `diary_entry_id`, `category`, `content`, `active`, `created_at` | ✅ |
| `onboarding_answers` | `id`, `user_id`, `q1_name`, `q2_lifestyle`, `q3_goal`, `completed`, `created_at` | ✅ |

> Todas as 7 tabelas possuem RLS ativo. Toda query com `user_id` no filtro está coberta por RLS como segunda barreira.

---

## Padrão de query Supabase

```python
# SELECT com filtro e ordenação
result = (
    self.db.table("tasks")
    .select("id, user_id, title, description, due_date, status, created_at, updated_at")
    .eq("user_id", user_id)
    .order("created_at", desc=True)
    .execute()
)
return result.data  # list[dict]

# INSERT com retorno
result = self.db.table("tasks").insert(payload).execute()
if not result.data:
    raise RuntimeError("Inserção retornou dados vazios.")
return result.data[0]

# UPDATE com filtro de segurança (user_id + id)
result = (
    self.db.table("tasks")
    .update(fields)
    .eq("id", task_id)
    .eq("user_id", user_id)   # sempre filtrar por user_id além do id
    .execute()
)
return result.data[0] if result.data else None

# DELETE
result = (
    self.db.table("tasks")
    .delete()
    .eq("id", task_id)
    .eq("user_id", user_id)
    .execute()
)
return len(result.data) > 0  # bool

# ILIKE (busca textual)
result = (
    self.db.table("diary_entries")
    .select("*")
    .eq("user_id", user_id)
    .ilike("content", f"%{query}%")
    .execute()
)
```

---

## Padrão de injeção (padrão recomendado)

```python
# repository.py — recebe db via __init__
class ExemploRepository:
    def __init__(self, db: Any):
        self.db = db

    def list_by_user(self, user_id: str) -> list[dict]:
        result = (
            self.db.table("exemplo")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        return result.data
```

```python
# controller.py — injeta db via Depends(get_supabase)
def get_exemplo_service(db=Depends(get_supabase)) -> ExemploService:
    repo = ExemploRepository(db=db)
    return ExemploService(repository=repo)
```

Isso permite substituir o `db` por um mock nos testes via `app.dependency_overrides[get_supabase]`.

---

## Como mockar nos testes

```python
# conftest.py
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
    db.execute = MagicMock(return_value=MagicMock(data=[]))
    return db

# fixture
@pytest.fixture
def mock_supabase():
    return make_mock_supabase()

# override nas fixtures de cliente
app.dependency_overrides[get_supabase] = lambda: make_mock_supabase()
```

Para simular retorno de dados:
```python
db.execute = MagicMock(return_value=MagicMock(data=[
    {"id": "task-1", "user_id": "user-1", "title": "Tarefa", "status": "pending"}
]))
```

---

## Como criar um novo Repository

1. Crie `backend/app/repositories/<dominio>_repository.py`
2. Use o padrão de injeção: `def __init__(self, db: Any):`
3. Implemente métodos com nomes descritivos: `list_by_user`, `get_by_id`, `create`, `update`, `delete`
4. **Sempre** incluir `user_id` nos filtros de update/delete (segurança + RLS)
5. Use logging para operações críticas:
   ```python
   import logging
   logger = logging.getLogger(__name__)
   logger.info("Tarefa criada: id=%s user_id=%s", result.data[0]["id"], user_id)
   logger.error("Erro ao criar tarefa")
   ```
6. Envolva operações críticas em `try/except Exception: logger.error(...); raise`

---

## Anti-patterns — nunca faça isso

```python
# ❌ Lógica de negócio no repository
def create(self, user_id: str, title: str):
    if not title.strip():                # ← vai para o Service
        raise ValueError("...")

# ❌ Query sem filtro de user_id em operações de escrita
.update(fields).eq("id", task_id)       # ← faltou .eq("user_id", user_id) — risco de IDOR

# ❌ Ignorar retorno vazio do INSERT
result = self.db.table("tasks").insert(payload).execute()
return result.data[0]                   # ← pode lançar IndexError — verificar result.data antes

# ❌ SELECT * em vez de colunas explícitas
.select("*")                            # ← em tabelas como users, pode vazar password_hash
                                        # Exceção: chat_repository usa * em conversations (sem dados sensíveis)

# ❌ Instanciar cliente Supabase no padrão novo
class ExemploRepository:
    def __init__(self):
        self._client = create_client(...)  # ← não injetável — use __init__(self, db: Any)
```
