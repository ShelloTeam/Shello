# Arquitetura — Shello

> Este documento define a arquitetura em camadas do backend e a separação frontend/backend.
> Todo novo código deve seguir este padrão. Desvios requerem ADR.

---

## Visão Geral

```
Cliente Mobile (React Native + Expo)
        │
        │ HTTP REST (JSON)
        ▼
┌─────────────────────────────────────────┐
│              FastAPI Backend            │
│                                         │
│  Controller (Routers)                   │
│       │                                 │
│  Service (Regras de Negócio)            │
│       │                                 │
│  Repository (Acesso a Dados)            │
│       │                                 │
│  Supabase Client (PostgreSQL + RLS)     │
└─────────────────────────────────────────┘
        │
        ▼
   Supabase (PostgreSQL + Auth + RLS)
```

---

## Camadas do Backend

### Controller (Routers)
**Localização:** `app/routers/`

**Responsabilidades:**
- Receber e validar HTTP requests via Pydantic schemas.
- Chamar o(s) service(s) correspondente(s).
- Serializar e retornar a HTTP response.
- Tratar erros de negócio e convertê-los em HTTP status codes adequados.

**Proibições:**
- ❌ Nunca acessar o Supabase diretamente.
- ❌ Nunca conter lógica de negócio (validações, cálculos, regras).
- ❌ Nunca fazer queries SQL ou chamadas ao ORM/SDK.

```python
# app/routers/diary.py
from fastapi import APIRouter, Depends, HTTPException
from app.services.diary_service import DiaryService
from app.schemas.diary import DiaryEntryCreate, DiaryEntryResponse
from app.dependencies import get_current_user, get_diary_service

router = APIRouter(prefix="/api/diary", tags=["diary"])

@router.post("/", response_model=DiaryEntryResponse, status_code=201)
async def create_entry(
    payload: DiaryEntryCreate,
    current_user: dict = Depends(get_current_user),
    service: DiaryService = Depends(get_diary_service),
):
    try:
        entry = await service.create_entry(
            user_id=current_user["id"],
            content=payload.content,
        )
        return entry
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
```

---

### Service (Regras de Negócio)
**Localização:** `app/services/`

**Responsabilidades:**
- Implementar **todas** as regras de negócio do domínio.
- Orquestrar chamadas a múltiplos repositórios quando necessário.
- Disparar side-effects assíncronos (ex.: extração de fragmentos via `asyncio.create_task()`).
- Lançar exceções de domínio (`ValueError`, `PermissionError`) que o controller converte em HTTP errors.

**Proibições:**
- ❌ Nunca construir HTTP responses (`JSONResponse`, `Response`).
- ❌ Nunca acessar o Supabase diretamente — sempre via repositório.
- ❌ Nunca importar `fastapi.Request` ou dependências HTTP.

```python
# app/services/diary_service.py
import asyncio
from app.repositories.diary_repository import DiaryRepository
from app.tasks.fragment_extraction import extract_fragments

class DiaryService:
    def __init__(self, repo: DiaryRepository):
        self.repo = repo

    async def create_entry(self, user_id: str, content: str) -> dict:
        # Regra: conteúdo vazio rejeitado
        if not content or not content.strip():
            raise ValueError("Conteúdo não pode ser vazio.")

        # Regra: máximo 10.000 caracteres
        if len(content) > 10_000:
            raise ValueError("Conteúdo excede o limite de 10.000 caracteres.")

        entry = await self.repo.create(user_id=user_id, content=content)

        # Regra: extração assíncrona para conteúdo > 100 chars
        if len(content) > 100:
            asyncio.create_task(extract_fragments(entry["id"], content))

        return entry
```

---

### Repository (Acesso a Dados)
**Localização:** `app/repositories/`

**Responsabilidades:**
- Encapsular **todo** o acesso ao Supabase (queries, inserts, updates, deletes).
- Traduzir dados brutos do Supabase para dicts/modelos que o service consome.
- Tratar erros do Supabase SDK e relançar como exceções genéricas.

**Proibições:**
- ❌ Nunca conter lógica de negócio.
- ❌ Nunca ser chamado diretamente pelo controller.
- ❌ Nunca fazer chamadas externas (OpenAI, etc.) — isso é responsabilidade do service.

```python
# app/repositories/diary_repository.py
from app.db.supabase_client import get_supabase

class DiaryRepository:
    def __init__(self, supabase_client):
        self.client = supabase_client

    async def create(self, user_id: str, content: str) -> dict:
        response = (
            self.client
            .table("diary_entries")
            .insert({"user_id": user_id, "content": content})
            .execute()
        )
        return response.data[0]

    async def get_by_id(self, entry_id: str, user_id: str) -> dict | None:
        response = (
            self.client
            .table("diary_entries")
            .select("*")
            .eq("id", entry_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return response.data
```

---

## Injeção de Dependências (FastAPI `Depends()`)

Dependências são declaradas em `app/dependencies.py` e injetadas nos controllers via `Depends()`.
Nunca instanciar services ou repositories manualmente dentro de routers.

```python
# app/dependencies.py
from fastapi import Depends, HTTPException, status
from app.db.supabase_client import get_supabase
from app.repositories.diary_repository import DiaryRepository
from app.services.diary_service import DiaryService
from app.core.auth import decode_jwt

def get_supabase_client():
    return get_supabase()

def get_diary_repo(client=Depends(get_supabase_client)) -> DiaryRepository:
    return DiaryRepository(client)

def get_diary_service(repo: DiaryRepository = Depends(get_diary_repo)) -> DiaryService:
    return DiaryService(repo)

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return payload
```

---

## Fluxo Completo — Exemplo: Criar Anotação

```
POST /api/diary/
        │
        ▼
[Controller] router/diary.py::create_entry()
  - Valida schema (Pydantic)
  - Extrai current_user via Depends(get_current_user)
  - Chama service.create_entry(user_id, content)
        │
        ▼
[Service] services/diary_service.py::create_entry()
  - Valida regras: vazio? > 10k chars?
  - Chama repo.create(user_id, content)
  - Se len(content) > 100: asyncio.create_task(extract_fragments(...))
  - Retorna dict com entry criada
        │
        ▼
[Repository] repositories/diary_repository.py::create()
  - Executa INSERT no Supabase
  - Retorna response.data[0]
        │
        ▼
[Supabase] PostgreSQL + RLS
  - Verifica RLS: user_id == auth.uid()
  - Persiste a linha
  - Retorna dados inseridos
```

---

## Separação Frontend / Backend

### Frontend (React Native + Expo)
- Toda lógica de apresentação, navegação e estado local.
- Comunicação com backend **exclusivamente via API REST (JSON)**.
- Nunca acessa o Supabase diretamente do app mobile — toda operação passa pelo backend FastAPI.
- Gerencia JWT localmente (AsyncStorage seguro ou SecureStore do Expo).

### Backend (FastAPI)
- Toda lógica de negócio, persistência e integração com OpenAI.
- Valida JWT em cada request autenticado.
- É o único componente que conhece o `SUPABASE_SERVICE_KEY` para operações administrativas.

### Comunicação
- **Protocolo:** HTTP/1.1 REST com JSON.
- **Autenticação:** `Authorization: Bearer <jwt>` no header ou cookie HTTPOnly.
- **Versionamento:** prefixo `/api/` em todas as rotas (sem versionamento de URL por ora).
- **Erros:** sempre retornados como `{"detail": "mensagem"}` seguindo o padrão FastAPI.
