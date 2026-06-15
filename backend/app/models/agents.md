# agents.md — Models (Schemas Pydantic) | Backend Shello

> Leia este arquivo ao trabalhar com schemas de request/response do backend.
> Para contexto geral do backend, consulte `backend/agents.md`.

---

## O que são os Models?

Esta pasta contém os **schemas Pydantic** de entrada (request) e saída (response) da API. São as definições dos contratos de dados entre o frontend e o backend.

> **Nota sobre nomenclatura**: O projeto tem duas pastas com schemas:
> - `app/models/` — schemas de **request/response dos controllers** (Bearer auth)
> - `app/schemas/` — schemas de **request/response das rotas api/v1/** (cookie auth)

---

## Arquivos existentes

### `app/models/` — Controllers (Bearer token)

| Arquivo              | Domínio                        | Schemas                                      |
|----------------------|--------------------------------|----------------------------------------------|
| `chat_models.py`     | Chat                           | `ChatRequest`, `ChatResponse`, `TaskSuggestion` |
| `diary_models.py`    | Diário                         | `DiaryEntryCreate`, `DiaryEntryUpdate`, `DiaryEntryResponse` |
| `task_models.py`     | Tarefas                        | `TaskCreate`, `TaskUpdate`, `TaskResponse`   |
| `history_models.py`  | Histórico unificado            | `HistoryItem`, `HistoryResponse`             |
| `memory_models.py`   | Fragmentos de contexto         | `MemoryFragment`, `MemoryListResponse`       |
| `routine_models.py`  | Rotinas                        | `RoutineCreate`, `RoutineResponse`           |
| `user_models.py`     | Usuário e preferências         | `UserPreferencesUpdate`, `PasswordChange`, `UserResponse` |
| `context_models.py`  | Contexto do agente             | `ContextFragmentResponse`                    |

### `app/schemas/` — API v1 (cookie-based)

| Arquivo                   | Domínio                | Schemas                                  |
|---------------------------|------------------------|------------------------------------------|
| `auth.py`                 | Autenticação           | `RegisterRequest`, `LoginRequest`, `TokenResponse` |
| `onboarding.py`           | Onboarding             | `OnboardingAnswers`, `OnboardingResponse` |
| `tasks.py`                | Tarefas (v1)           | Schemas de task para api/v1             |
| `context_fragments.py`    | Fragmentos de contexto | Schemas de context para api/v1          |

---

## Padrão obrigatório de schema

Todo campo de schema deve ter `description` e `example` para aparecer corretamente no Swagger:

```python
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID

class DiaryEntryCreate(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Conteúdo da anotação em texto plano. Sem formatação.",
        example="Hoje finalizei o módulo de autenticação. Amanhã começo o diário."
    )

class DiaryEntryResponse(BaseModel):
    id: UUID = Field(..., description="UUID único da anotação", example="550e8400-e29b-41d4-a716-446655440000")
    content: str = Field(..., description="Conteúdo da anotação")
    created_at: datetime = Field(..., description="Data e hora de criação (UTC)")
    updated_at: datetime = Field(..., description="Data e hora da última atualização (UTC)")
    date_group: str = Field(..., description="Data formatada para agrupamento na UI", example="2024-01-15")
```

---

## Schema de erro global

Todos os erros da API usam o schema `APIError`:

```python
from pydantic import BaseModel
from typing import Optional, Any

class APIError(BaseModel):
    error: str = Field(
        ...,
        description="Código de erro legível por máquina",
        example="LIMIT_EXCEEDED"
    )
    message: str = Field(
        ...,
        description="Mensagem legível para exibir na UI",
        example="Limite de 20 mensagens atingido. Inicie uma nova conversa."
    )
    detail: Optional[Any] = Field(
        None,
        description="Detalhes adicionais do erro, quando disponível"
    )
```

---

## Schemas críticos com regras especiais

### `TaskCreate` — `due_date` sempre None via chat
```python
class TaskFromChatCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    # due_date NUNCA é aceito via chat — regra D06 do MVP
    # O endpoint /api/tasks/from-chat ignora qualquer due_date recebido
```

### `UserPreferencesUpdate` — formalidade enum estrito
```python
class UserPreferencesUpdate(BaseModel):
    formalidade: Optional[Literal["baixa", "media", "alta"]] = None
    nome_referencia: Optional[str] = Field(None, max_length=30)
    theme: Optional[Literal["light", "dark"]] = None
```

### `ChatResponse` — campo `suggest_task`
```python
class ChatResponse(BaseModel):
    response: str                          # Resposta do agente
    mode: Literal["PRATICO", "PADRAO"]    # Modo detectado
    blocked: bool = False                  # True se moderação bloqueou
    conversation_id: UUID
    message_count: int                     # Total de mensagens na conversa
    suggest_task: Optional[TaskSuggestion] = None  # Preenchido no modo PRATICO
```

---

## Como criar um novo schema

1. Crie o arquivo `app/models/[domínio]_models.py`
2. Defina schemas de **entrada** (`Create`, `Update`) separados dos de **saída** (`Response`)
3. Todos os campos com `description` e `example`
4. Valide com `Field(min_length=..., max_length=...)` onde aplicável
5. Use `Literal` para campos com valores fixos (enums)
6. Importe e use o schema no controller correspondente

---

## Referências
- `backend/app/controllers/agents.md` — como usar schemas nos controllers
- `docs/product/business-rules.md` — regras de validação de domínio
- `docs/standards/architecture.md` — onde schemas se encaixam na arquitetura
