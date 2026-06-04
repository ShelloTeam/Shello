# CLAUDE.md — Backend Shello | Eduardo Neves de Souza

## METODOLOGIA OBRIGATÓRIA: TDD + POO

Este projeto usa **TDD estrito (Red → Green → Refactor)** com **POO em camadas MVC**.

### Ciclo obrigatório para CADA função implementada:

```
1. RED    → Escreva o teste primeiro. Rode e confirme que FALHA.
2. GREEN  → Escreva o mínimo de código para o teste passar.
3. REFACTOR → Melhore o código sem quebrar os testes.
```

**Se usar o plugin Superpowers, ative com `/tdd` antes de começar cada task.**

### Regras TDD inegociáveis:
- NUNCA escreva código de produção antes de ter um teste falhando.
- Um teste que nunca falhou não prova nada. Confirme o RED antes do GREEN.
- Após o GREEN, sempre verifique se há duplicação ou acoplamento para refatorar.
- Testes ficam em `backend/tests/` espelhando a estrutura de `app/`.
- Use `pytest` + `pytest-asyncio` + `httpx` para testes de endpoints.
- Use `unittest.mock` ou `pytest-mock` para mockar Supabase e OpenAI.

---

## ARQUITETURA POO OBRIGATÓRIA

```
backend/
├── app/
│   ├── controllers/        # FastAPI APIRouter — apenas recebe e responde
│   │   ├── diary_controller.py
│   │   ├── chat_controller.py
│   │   ├── context_controller.py
│   │   └── history_controller.py
│   ├── models/             # Schemas Pydantic de request/response
│   │   ├── diary_models.py
│   │   ├── chat_models.py
│   │   ├── context_models.py
│   │   └── history_models.py
│   ├── services/           # Lógica de negócio pura — TESTÁVEL sem banco
│   │   ├── diary_service.py
│   │   ├── chat_service.py
│   │   ├── extraction_service.py
│   │   └── history_service.py
│   ├── repositories/       # Queries ao Supabase — mockadas nos testes
│   │   ├── diary_repository.py
│   │   ├── chat_repository.py
│   │   ├── context_repository.py
│   │   └── history_repository.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── dependencies.py
│   │   ├── mode_detector.py
│   │   ├── cost_tracker.py
│   │   ├── scheduler.py
│   │   └── llm/
│   │       ├── base.py              # Classe abstrata LLMProvider
│   │       └── openai_provider.py  # Implementação concreta
│   └── main.py
├── tests/
│   ├── conftest.py          # Fixtures globais: app, client, mocks
│   ├── test_rls.py
│   ├── test_diary.py
│   ├── test_mode_detector.py
│   ├── test_llm_provider.py
│   ├── test_chat.py
│   ├── test_extraction.py
│   ├── test_cost_tracker.py
│   └── test_history.py
├── requirements.txt
└── .env.example
```

### Padrão POO: separação de responsabilidades

**Controller** — só roteia, nunca tem lógica:
```python
@router.post("/diary", response_model=DiaryEntryResponse, status_code=201)
async def create_entry(
    body: DiaryEntryCreate,
    current_user: User = Depends(get_current_user),
    service: DiaryService = Depends(get_diary_service)
):
    """Cria nova anotação. Toda lógica está no DiaryService."""
    return await service.create(user_id=current_user.id, content=body.content)
```

**Service** — lógica pura, sem chamadas diretas ao banco:
```python
class DiaryService:
    def __init__(self, repository: DiaryRepository, extraction_service: ExtractionService):
        self.repository = repository
        self.extraction_service = extraction_service

    async def create(self, user_id: str, content: str) -> DiaryEntry:
        """Valida e persiste anotação. Dispara extração assíncrona se > 100 chars."""
        if not content.strip():
            raise ValueError("Conteúdo não pode ser vazio.")
        entry = await self.repository.create(user_id=user_id, content=content)
        if len(content) > 100:
            asyncio.create_task(
                self.extraction_service.extract_from_diary(entry.id, content, user_id)
            )
        return entry
```

**Repository** — só queries, injetado via dependência:
```python
class DiaryRepository:
    def __init__(self, db: SupabaseClient):
        self.db = db

    async def create(self, user_id: str, content: str) -> DiaryEntry:
        """Insere anotação e retorna o registro."""
        result = self.db.table("diary_entries").insert({
            "user_id": user_id, "content": content
        }).execute()
        return DiaryEntry(**result.data[0])
```

---

## TASKS — EXECUTE UMA POR VEZ NA ORDEM ABAIXO

Para cada task: **RED → GREEN → REFACTOR → validar critérios → próxima task.**

---

### TASK 1 — SCRUM-22 | Validação de RLS

**Objetivo:** Confirmar que todas as 7 tabelas têm RLS ativo via código.

**Ciclo TDD:**

```
RED: Escreva tests/test_rls.py com os casos abaixo e confirme que FALHAM.
GREEN: Implemente app/core/rls_validator.py até todos passarem.
REFACTOR: Elimine repetição nos métodos de validação por tabela.
```

**Testes a escrever primeiro (test_rls.py):**
```python
def test_rls_validator_has_validate_all_method():
    validator = RLSValidator(db=mock_db)
    assert hasattr(validator, 'validate_all')

async def test_validate_all_returns_ok_when_all_tables_isolated():
    # mock: queries cross-user retornam lista vazia
    result = await validator.validate_all()
    assert result["status"] == "ok"
    assert len(result["tables"]) == 7

async def test_validate_all_returns_fail_when_data_leaks():
    # mock: uma query cross-user retorna dados
    result = await validator.validate_all()
    assert result["status"] == "fail"
    assert any(t["isolated"] == False for t in result["tables"])
```

**Implementar após os testes falharem:**
- `app/core/rls_validator.py`: classe `RLSValidator` com método `validate_all()`
- Tabelas: `users`, `diary_entries`, `tasks`, `conversations`, `messages`, `context_fragments`, `onboarding_answers`
- Endpoint `GET /admin/rls-check` protegido por `ADMIN_KEY` no header

**Critérios de aceitação:**
- [ ] Todos os testes de RLS passando (GREEN)
- [ ] `validate_all()` retorna `{"status": "ok", "tables": [...]}` com 7 tabelas
- [ ] HTTP 403 simulado e testado em acesso cross-user

---

### TASK 2 — SCRUM-23 | CRUD Diário + Busca Full-Text

**Objetivo:** CRUD completo de anotações com busca ILIKE.

**Ciclo TDD:**

```
RED: Escreva tests/test_diary.py com todos os casos. Confirme que FALHAM.
GREEN: Implemente DiaryRepository → DiaryService → diary_controller.
REFACTOR: Extraia validações de ownership para um método base reutilizável.
```

**Testes a escrever primeiro (test_diary.py):**
```python
# SERVICE — mockando o repository
async def test_create_diary_entry_success(mock_diary_repo):
    service = DiaryService(repository=mock_diary_repo, extraction_service=mock_extraction)
    entry = await service.create(user_id="user-1", content="Hoje foi um dia produtivo")
    assert entry.content == "Hoje foi um dia produtivo"
    mock_diary_repo.create.assert_called_once()

async def test_create_diary_entry_empty_content_raises_error(mock_diary_repo):
    service = DiaryService(repository=mock_diary_repo, extraction_service=mock_extraction)
    with pytest.raises(ValueError, match="vazio"):
        await service.create(user_id="user-1", content="   ")

async def test_create_diary_triggers_extraction_when_content_over_100_chars(mock_diary_repo):
    content = "x" * 101
    await service.create(user_id="user-1", content=content)
    mock_extraction.extract_from_diary.assert_called_once()

async def test_create_diary_no_extraction_when_content_under_100_chars(mock_diary_repo):
    await service.create(user_id="user-1", content="curto")
    mock_extraction.extract_from_diary.assert_not_called()

async def test_delete_diary_entry_wrong_user_raises_forbidden(mock_diary_repo):
    mock_diary_repo.get_by_id.return_value = DiaryEntry(user_id="user-2", ...)
    with pytest.raises(PermissionError):
        await service.delete(entry_id="uuid", current_user_id="user-1")

# CONTROLLER — usando httpx TestClient
async def test_post_diary_returns_201(client, auth_headers):
    response = await client.post("/api/diary", json={"content": "texto"}, headers=auth_headers)
    assert response.status_code == 201

async def test_post_diary_empty_returns_422(client, auth_headers):
    response = await client.post("/api/diary", json={"content": ""}, headers=auth_headers)
    assert response.status_code == 422

async def test_delete_diary_other_user_returns_403(client, auth_headers_user2):
    response = await client.delete("/api/diary/entry-of-user1", headers=auth_headers_user2)
    assert response.status_code == 403

async def test_search_diary_returns_results(client, auth_headers):
    response = await client.get("/api/diary/search?q=produtivo", headers=auth_headers)
    assert response.status_code == 200
    assert "items" in response.json()
```

**Endpoints a implementar:**
```
POST   /api/diary
GET    /api/diary          # paginado, agrupado por dia
PUT    /api/diary/{id}
DELETE /api/diary/{id}
GET    /api/diary/search?q=
```

**Critérios de aceitação:**
- [ ] Todos os testes passando (GREEN)
- [ ] POST com conteúdo vazio retorna 422
- [ ] DELETE de outro usuário retorna 403
- [ ] Busca ILIKE funcional

---

### TASK 3 — SCRUM-28 | LLMProvider Abstrato + OpenAI

**Objetivo:** Abstração de LLM que permite troca de provedor em 1 arquivo.

**Ciclo TDD:**

```
RED: Escreva tests/test_llm_provider.py. Confirme que FALHAM.
GREEN: Implemente base.py e openai_provider.py.
REFACTOR: Garanta que LLMProviderError é a única exceção pública da interface.
```

**Testes a escrever primeiro (test_llm_provider.py):**
```python
def test_llm_provider_is_abstract():
    with pytest.raises(TypeError):
        LLMProvider()  # não pode instanciar diretamente

def test_openai_provider_implements_interface():
    provider = OpenAIProvider(api_key="test")
    assert isinstance(provider, LLMProvider)

def test_openai_provider_uses_fixed_model(mock_openai_client):
    provider = OpenAIProvider(api_key="test")
    await provider.generate(system_prompt="...", history=[], user_message="oi")
    call_kwargs = mock_openai_client.chat.completions.create.call_args
    assert call_kwargs.kwargs["model"] == "gpt-4o-mini-2024-07-18"

def test_openai_provider_uses_fixed_temperature(mock_openai_client):
    await provider.generate(...)
    assert mock_openai_client.chat.completions.create.call_args.kwargs["temperature"] == 0.7

def test_moderate_returns_true_when_content_safe(mock_openai_client):
    mock_openai_client.moderations.create.return_value.results[0].flagged = False
    result = await provider.moderate("texto seguro")
    assert result is True

def test_moderate_returns_false_when_content_flagged(mock_openai_client):
    mock_openai_client.moderations.create.return_value.results[0].flagged = True
    result = await provider.moderate("texto problemático")
    assert result is False

def test_generate_raises_llm_provider_error_on_api_failure(mock_openai_client):
    mock_openai_client.chat.completions.create.side_effect = Exception("API down")
    with pytest.raises(LLMProviderError):
        await provider.generate(...)
```

**Implementar após os testes falharem:**
- `app/core/llm/base.py`: classe abstrata `LLMProvider` com `generate()` e `moderate()`
- `app/core/llm/openai_provider.py`: implementação concreta `OpenAIProvider`
- `app/core/llm/exceptions.py`: `LLMProviderError`
- Modelo fixado: `gpt-4o-mini-2024-07-18` — hardcoded, nunca variável
- Temperatura: `0.7` — hardcoded

**Critérios de aceitação:**
- [ ] Todos os testes passando (GREEN)
- [ ] Modelo e temperatura fixados e testados
- [ ] `LLMProviderError` lançada em qualquer falha da API

---

### TASK 4 — SCRUM-31 | Endpoint POST /api/chat

**Objetivo:** Endpoint principal do chat com fluxo completo.

**Ciclo TDD:**

```
RED: Escreva tests/test_chat.py com todos os casos. Confirme que FALHAM.
GREEN: Implemente ChatService → chat_controller.
REFACTOR: Extraia o build_prompt() para uma classe PromptBuilder separada.
```

**Testes a escrever primeiro (test_chat.py):**
```python
# MODE DETECTOR
def test_detect_mode_returns_pratico_for_task_keyword():
    assert detect_mode("quero criar tarefa para amanhã") == "PRATICO"

def test_detect_mode_returns_padrao_for_regular_message():
    assert detect_mode("como você está hoje?") == "PADRAO"

def test_detect_mode_is_case_insensitive():
    assert detect_mode("CRIAR TAREFA urgente") == "PRATICO"

# CHAT SERVICE
async def test_chat_blocks_after_20_messages(mock_chat_repo):
    mock_chat_repo.get_active_conversation.return_value = Conversation(message_count=20)
    with pytest.raises(ValueError, match="Limite de 20 mensagens"):
        await chat_service.send(user_id="u1", message="oi")

async def test_chat_does_not_save_blocked_response(mock_llm, mock_chat_repo):
    mock_llm.moderate.return_value = False  # conteúdo bloqueado
    await chat_service.send(user_id="u1", message="mensagem")
    mock_chat_repo.save_message.assert_not_called()

async def test_chat_saves_messages_when_response_approved(mock_llm, mock_chat_repo):
    mock_llm.moderate.return_value = True
    await chat_service.send(user_id="u1", message="mensagem")
    assert mock_chat_repo.save_message.call_count == 2  # user + assistant

async def test_chat_returns_503_when_llm_fails(client, auth_headers, mock_llm):
    mock_llm.generate.side_effect = LLMProviderError("API down")
    response = await client.post("/api/chat", json={"message": "oi"}, headers=auth_headers)
    assert response.status_code == 503

# PROMPT BUILDER
def test_prompt_builder_includes_all_6_blocks():
    prompt = PromptBuilder().build(user=mock_user, fragments=[], history=[], mode="PADRAO", message="oi")
    assert "IDENTIDADE" in prompt
    assert "PARÂMETROS" in prompt
    assert "CONTEXTO" in prompt
    assert "MODO" in prompt
    assert "HISTÓRICO" in prompt
    assert "oi" in prompt

def test_prompt_builder_truncates_history_to_1500_tokens():
    long_history = [{"role": "user", "content": "x" * 200}] * 20
    prompt = PromptBuilder().build(..., history=long_history, ...)
    assert count_tokens(prompt) <= 1500 + FIXED_BLOCKS_TOKENS
```

**Fluxo do ChatService.send():**
```
1. Buscar/criar conversa ativa
2. Verificar message_count < 20
3. Buscar fragmentos ativos (LIMIT 20, ORDER BY created_at ASC)
4. Buscar histórico (truncar a 1.500 tokens)
5. detect_mode(message) → modo
6. PromptBuilder.build() → system_prompt
7. LLMProvider.generate()
8. LLMProvider.moderate(response)
9. Se BLOQUEADO: não salvar, retornar {"blocked": true}
10. Se APROVADO: salvar user + assistant, incrementar message_count
```

**Job de auto-arquivo (app/core/scheduler.py):**
```python
class ConversationScheduler:
    def __init__(self, chat_repository: ChatRepository):
        self.scheduler = AsyncIOScheduler()
        self.repository = chat_repository

    def start(self):
        """Registra o job de auto-arquivo e inicia o scheduler."""
        self.scheduler.add_job(self._archive_inactive, 'interval', minutes=15)
        self.scheduler.start()

    async def _archive_inactive(self):
        """Arquiva conversas com inatividade > 2h."""
        cutoff = datetime.utcnow() - timedelta(hours=2)
        await self.repository.archive_before(cutoff)
```

**Critérios de aceitação:**
- [ ] Todos os testes passando (GREEN)
- [ ] Resposta bloqueada não salva (testado)
- [ ] Limite de 20 mensagens retorna 400 (testado)
- [ ] LLMProviderError retorna 503 (testado)
- [ ] Job de auto-arquivo iniciado no startup

---

### TASK 5 — SCRUM-33 | Endpoint POST /api/diary/extract

**Objetivo:** Extração assíncrona de fragmentos de contexto do diário via LLM.

**Ciclo TDD:**

```
RED: Escreva tests/test_extraction.py. Confirme que FALHAM.
GREEN: Implemente ExtractionService.
REFACTOR: Extraia o parse_llm_response() para método isolado e testável.
```

**Testes a escrever primeiro (test_extraction.py):**
```python
async def test_extraction_returns_fragments_from_valid_llm_response(mock_llm):
    mock_llm.generate.return_value = '{"fragmentos": [{"content": "Gosta de café", "category": "preferencia"}]}'
    fragments = await extraction_service.extract_from_diary("entry-1", "texto longo...", "user-1")
    assert len(fragments) == 1
    assert fragments[0].category == "preferencia"

async def test_extraction_returns_empty_list_on_invalid_json(mock_llm):
    mock_llm.generate.return_value = "isso não é json"
    fragments = await extraction_service.extract_from_diary("entry-1", "texto", "user-1")
    assert fragments == []  # não lança exceção

async def test_extraction_saves_fragments_with_is_active_false(mock_llm, mock_context_repo):
    await extraction_service.extract_from_diary("entry-1", "texto longo" * 20, "user-1")
    saved = mock_context_repo.save.call_args.kwargs
    assert saved["is_active"] == False

async def test_extraction_does_not_block_diary_save(mock_llm):
    # Verifica que é chamada com asyncio.create_task (não await direto)
    with patch("asyncio.create_task") as mock_task:
        await diary_service.create(user_id="u1", content="x" * 101)
        mock_task.assert_called_once()

async def test_extraction_logs_token_cost(mock_llm, mock_cost_tracker):
    await extraction_service.extract_from_diary("entry-1", "texto", "user-1")
    mock_cost_tracker.log_and_check.assert_called_once()
```

**Implementar após os testes falharem:**
- `app/services/extraction_service.py`: classe `ExtractionService` com `extract_from_diary()`
- Prompt de extração: retornar apenas JSON válido, terceira pessoa, max 300 chars, sem conteúdo emocional
- `parse_llm_response()`: método privado que parseia o JSON e trata erros silenciosamente
- Fragmentos salvos com `is_active=False` e `derived_from_conversation_id=None`

**Critérios de aceitação:**
- [ ] Todos os testes passando (GREEN)
- [ ] JSON inválido do LLM não quebra o sistema (testado)
- [ ] Fragmentos salvos com `is_active=False` (testado)
- [ ] Extração não bloqueia o retorno do POST /api/diary (testado)

---

### TASK 6 — SCRUM-40 | Alerta de Custo de Tokens

**Objetivo:** Monitorar custo por usuário e alertar ao ultrapassar $0,50/dia.

**Ciclo TDD:**

```
RED: Escreva tests/test_cost_tracker.py. Confirme que FALHAM.
GREEN: Implemente CostTracker.
REFACTOR: Garanta que o cálculo de custo é um método puro sem side effects.
```

**Testes a escrever primeiro (test_cost_tracker.py):**
```python
def test_calculate_cost_returns_correct_value():
    tracker = CostTracker()
    cost = tracker.calculate_cost(input_tokens=1000, output_tokens=500)
    # input: 1000/1M * $0.150 = $0.00015
    # output: 500/1M * $0.600 = $0.0003
    assert abs(cost - 0.00045) < 0.000001

def test_calculate_cost_is_pure_function():
    tracker = CostTracker()
    cost1 = tracker.calculate_cost(1000, 500)
    cost2 = tracker.calculate_cost(1000, 500)
    assert cost1 == cost2  # mesmo resultado, sem side effects

async def test_log_and_check_triggers_alert_when_above_threshold(mock_repo, mock_logger):
    # simula acúmulo diário de $0.51
    mock_repo.get_daily_cost.return_value = 0.51
    await tracker.log_and_check("user-1", 1000, 500, "chat")
    mock_logger.warning.assert_called_once()
    assert "COST ALERT" in mock_logger.warning.call_args[0][0]

async def test_log_and_check_no_alert_when_below_threshold(mock_repo, mock_logger):
    mock_repo.get_daily_cost.return_value = 0.10
    await tracker.log_and_check("user-1", 1000, 500, "chat")
    mock_logger.warning.assert_not_called()

async def test_cost_tracker_called_on_every_llm_call(mock_llm, mock_cost_tracker):
    await openai_provider.generate(system_prompt="...", history=[], user_message="oi")
    mock_cost_tracker.log_and_check.assert_called_once()
```

**Preços (gpt-4o-mini-2024-07-18):**
```python
PRICE_INPUT_PER_M  = 0.150   # $0.150 por 1M tokens de input
PRICE_OUTPUT_PER_M = 0.600   # $0.600 por 1M tokens de output
DAILY_ALERT_THRESHOLD = 0.50 # dólares por usuário por dia
```

**Critérios de aceitação:**
- [ ] Todos os testes passando (GREEN)
- [ ] `calculate_cost()` é função pura (testado)
- [ ] Alerta disparado exatamente quando custo > $0,50 (testado)
- [ ] `log_and_check()` chamado em TODA chamada ao LLM (testado)

---

### TASK 7 — SCRUM-41 | Histórico Unificado Paginado

**Objetivo:** Endpoint que unifica conversas e anotações com busca e paginação.

**Ciclo TDD:**

```
RED: Escreva tests/test_history.py. Confirme que FALHAM.
GREEN: Implemente HistoryRepository → HistoryService → history_controller.
REFACTOR: Garanta que o merge de duas listas ordenadas está em método isolado e testado.
```

**Testes a escrever primeiro (test_history.py):**
```python
async def test_list_unified_returns_both_types(mock_history_repo):
    mock_history_repo.list_conversations.return_value = [mock_conv]
    mock_history_repo.list_diary_entries.return_value = [mock_entry]
    result = await history_service.list_unified(user_id="u1")
    types = [item.type for item in result.items]
    assert "conversation" in types
    assert "diary" in types

async def test_list_unified_filters_by_type_conversation(mock_history_repo):
    result = await history_service.list_unified(user_id="u1", type_filter="conversation")
    mock_history_repo.list_diary_entries.assert_not_called()

async def test_list_unified_filters_by_type_diary(mock_history_repo):
    result = await history_service.list_unified(user_id="u1", type_filter="diary")
    mock_history_repo.list_conversations.assert_not_called()

def test_merge_sorted_returns_items_in_desc_order():
    items_a = [HistoryItem(created_at=datetime(2024,1,3), ...)]
    items_b = [HistoryItem(created_at=datetime(2024,1,5), ...)]
    merged = history_service._merge_sorted(items_a, items_b)
    assert merged[0].created_at > merged[1].created_at

async def test_search_filters_by_keyword(mock_history_repo):
    await history_service.list_unified(user_id="u1", query="café")
    mock_history_repo.search_conversations.assert_called_with(user_id="u1", query="café")
    mock_history_repo.search_diary_entries.assert_called_with(user_id="u1", query="café")

async def test_history_uses_parallel_queries(mock_history_repo):
    with patch("asyncio.gather") as mock_gather:
        await history_service.list_unified(user_id="u1")
        mock_gather.assert_called_once()  # queries paralelas via asyncio.gather

async def test_history_endpoint_returns_403_without_auth(client):
    response = await client.get("/api/history")
    assert response.status_code == 401

async def test_history_response_has_correct_schema(client, auth_headers):
    response = await client.get("/api/history", headers=auth_headers)
    body = response.json()
    assert "items" in body
    assert "total" in body
    assert "has_more" in body
```

**Models Pydantic:**
```python
class HistoryItem(BaseModel):
    id: UUID
    type: Literal["conversation", "diary"]
    preview: str        # primeiros 120 chars
    created_at: datetime
    item_count: int     # mensagens (conversa) ou palavras (diário)

class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int
    page: int
    page_size: int
    has_more: bool
```

**Critérios de aceitação:**
- [ ] Todos os testes passando (GREEN)
- [ ] Queries paralelas via `asyncio.gather` (testado)
- [ ] Filtro por `type` funcional (testado)
- [ ] Busca por `?q=` funcional (testado)
- [ ] Merge ordenado por `created_at DESC` (testado)

---

### TASK 8 — SCRUM-38 | [BACK][S4] Endpoint POST /api/tasks/from-chat

> ⚠️ **ESCOPO BACKEND APENAS.** A parte de frontend (card de preview, botões Confirmar/Cancelar) é responsabilidade do dev de front. Entregue apenas o endpoint e a lógica de backend.

**Objetivo:** Endpoint que recebe um título de tarefa já confirmado pelo usuário via chat e cria a tarefa.

**Ciclo TDD:**
```
RED: Escreva tests/test_tasks_from_chat.py. Confirme que FALHAM.
GREEN: Implemente o endpoint e o service.
REFACTOR: Garanta que a lógica de criação via chat reutiliza o TaskService base.
```

**Testes a escrever primeiro:**
```python
async def test_create_task_from_chat_returns_201(client, auth_headers):
    response = await client.post(
        "/api/tasks/from-chat",
        json={"title": "Comprar pão"},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Comprar pão"

async def test_create_task_from_chat_due_date_is_null(client, auth_headers):
    response = await client.post(
        "/api/tasks/from-chat",
        json={"title": "Tarefa sem data"},
        headers=auth_headers
    )
    assert response.json()["due_date"] is None

async def test_create_task_from_chat_empty_title_returns_422(client, auth_headers):
    response = await client.post(
        "/api/tasks/from-chat",
        json={"title": ""},
        headers=auth_headers
    )
    assert response.status_code == 422

async def test_create_task_from_chat_requires_auth(client):
    response = await client.post("/api/tasks/from-chat", json={"title": "Teste"})
    assert response.status_code == 401

async def test_create_multiple_tasks_from_chat(client, auth_headers):
    # Suporte a até 3 tarefas por chamada (pedidos complexos)
    response = await client.post(
        "/api/tasks/from-chat",
        json={"tasks": [{"title": "Tarefa 1"}, {"title": "Tarefa 2"}]},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert len(response.json()["created"]) == 2
```

**Endpoint a implementar:**
```
POST /api/tasks/from-chat
Body: {"title": "string"} ou {"tasks": [{"title": "string"}, ...]}  # até 3
Response 201: {"id": uuid, "title": str, "due_date": null, "status": "pending"}
             ou {"created": [...]}  # para múltiplas tarefas
```

**Regras:**
- `due_date` sempre `NULL` — **nunca** tentar parsear data de texto livre (D06 do MVP)
- Máximo 3 tarefas por chamada
- Reutiliza `TaskService.create()` internamente — zero duplicação de lógica
- Frontend é responsável pelo card de preview e confirmação; este endpoint só é chamado **após** confirmação explícita do usuário

**Critérios de aceitação:**
- [ ] Todos os testes passando (GREEN)
- [ ] `due_date` sempre `null` na resposta (testado)
- [ ] Máximo 3 tarefas por chamada retorna 422 se exceder
- [ ] Endpoint reutiliza `TaskService.create()` (verificar no código)

---

### TASK 9 — SCRUM-39 | [BACK][S4] Endpoints de Configurações - Preferências + Senha

> ⚠️ **ESCOPO BACKEND APENAS.** Toggle de tema, selects de formalidade e campos de senha na tela são responsabilidade do dev de front. Entregue apenas os endpoints de atualização.

**Objetivo:** Endpoints para atualizar preferências do agente (formalidade + nome_referencia) e alterar senha.

**Ciclo TDD:**
```
RED: Escreva tests/test_user_settings.py. Confirme que FALHAM.
GREEN: Implemente os endpoints e o UserService.
REFACTOR: Garanta que validação de senha atual está isolada em método testável.
```

**Testes a escrever primeiro:**
```python
async def test_update_preferences_returns_200(client, auth_headers):
    response = await client.put(
        "/api/users/preferences",
        json={"formalidade": "alta", "nome_referencia": "Edu"},
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["formalidade"] == "alta"
    assert response.json()["nome_referencia"] == "Edu"

async def test_update_preferences_invalid_formalidade_returns_422(client, auth_headers):
    response = await client.put(
        "/api/users/preferences",
        json={"formalidade": "invalida"},
        headers=auth_headers
    )
    assert response.status_code == 422

async def test_update_preferences_nome_referencia_max_30_chars(client, auth_headers):
    response = await client.put(
        "/api/users/preferences",
        json={"nome_referencia": "x" * 31},
        headers=auth_headers
    )
    assert response.status_code == 422

async def test_change_password_success(client, auth_headers):
    response = await client.put(
        "/api/users/password",
        json={"current_password": "senha_atual", "new_password": "nova_senha123"},
        headers=auth_headers
    )
    assert response.status_code == 200

async def test_change_password_wrong_current_returns_401(client, auth_headers):
    response = await client.put(
        "/api/users/password",
        json={"current_password": "senha_errada", "new_password": "nova123"},
        headers=auth_headers
    )
    assert response.status_code == 401

async def test_change_password_new_too_short_returns_422(client, auth_headers):
    response = await client.put(
        "/api/users/password",
        json={"current_password": "senha_atual", "new_password": "curta"},
        headers=auth_headers
    )
    assert response.status_code == 422

async def test_preferences_sync_across_sessions(mock_user_repo):
    # Preferências salvas no banco e retornadas em qualquer login
    await user_service.update_preferences("user-1", formalidade="baixa", nome_referencia="Edu")
    prefs = await user_service.get_preferences("user-1")
    assert prefs.formalidade == "baixa"
```

**Endpoints a implementar:**
```
PUT /api/users/preferences
Body: {"formalidade": "baixa"|"media"|"alta", "nome_referencia": str (max 30 chars)}
Response 200: {"formalidade": str, "nome_referencia": str}

PUT /api/users/password
Body: {"current_password": str, "new_password": str (min 8 chars)}
Response 200: {"message": "Senha alterada com sucesso."}
```

**Regras:**
- `formalidade`: enum estrito — apenas `"baixa"`, `"media"`, `"alta"` aceitos
- `nome_referencia`: máx 30 chars, sem validação de conteúdo (aceita qualquer string)
- `current_password`: verificar contra hash no banco antes de aceitar a troca
- `new_password`: mínimo 8 chars com letras e números (validação Pydantic)
- Preferências persistidas em `users.formalidade` e `users.nome_referencia`
- Tema (`users.theme`) atualizado via `PUT /api/users/preferences` também, campo opcional: `"theme": "light"|"dark"`

**Critérios de aceitação:**
- [ ] Todos os testes passando (GREEN)
- [ ] Formalidade inválida retorna 422 (testado)
- [ ] Senha atual errada retorna 401 (testado)
- [ ] Nova senha curta retorna 422 (testado)
- [ ] Preferências sincronizadas — persistidas no banco (testado)

---

## DOCUMENTAÇÃO OBRIGATÓRIA

> Esta seção deve ser executada **junto com a implementação de cada endpoint**, não no final.
> O dev de frontend depende desta documentação para trabalhar de forma independente.
> Swagger incompleto = frontend bloqueado.

---

### PARTE 1 — Swagger / OpenAPI (FastAPI)

Todo endpoint deve ter documentação **completa e rigorosa** no código usando os recursos nativos do FastAPI. O Swagger gerado em `/docs` deve ser suficiente para o dev de frontend implementar qualquer tela sem precisar perguntar nada.

**Padrão obrigatório para cada endpoint:**

```python
@router.post(
    "/diary",
    response_model=DiaryEntryResponse,
    status_code=201,
    summary="Criar nova anotação no diário",
    description="""
    Cria uma nova anotação de texto plano no diário do usuário autenticado.
    
    **Regras de negócio:**
    - Conteúdo vazio ou apenas espaços é rejeitado (422)
    - Conteúdo com mais de 100 caracteres dispara extração assíncrona de contexto
      (não bloqueia a resposta — o usuário não precisa aguardar)
    - Máximo de 10.000 caracteres por anotação
    - A anotação é associada automaticamente ao usuário do token JWT
    
    **Autenticação:** Bearer token JWT obrigatório no header `Authorization`
    """,
    responses={
        201: {
            "description": "Anotação criada com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "content": "Hoje foi um dia muito produtivo. Consegui terminar o módulo de autenticação.",
                        "created_at": "2024-01-15T14:30:00Z",
                        "updated_at": "2024-01-15T14:30:00Z",
                        "date_group": "2024-01-15"
                    }
                }
            }
        },
        401: {"description": "Token JWT ausente ou inválido"},
        422: {
            "description": "Conteúdo inválido",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [{"loc": ["body", "content"], "msg": "O conteúdo não pode ser vazio", "type": "value_error"}]
                    }
                }
            }
        }
    },
    tags=["Diário"]
)
async def create_diary_entry(...):
```

**Tags obrigatórias** — todos os endpoints devem ter uma tag para organização no Swagger:
```python
# Em main.py, definir os metadados das tags:
tags_metadata = [
    {"name": "Health",        "description": "Verificação de saúde da API"},
    {"name": "Auth",          "description": "Autenticação e onboarding"},
    {"name": "Diário",        "description": "CRUD de anotações pessoais"},
    {"name": "Tarefas",       "description": "Gestão de tarefas (ToDo)"},
    {"name": "Chat",          "description": "Conversas com o agente Shello"},
    {"name": "Contexto",      "description": "Fragmentos de contexto do agente"},
    {"name": "Configurações", "description": "Preferências de conta e do agente"},
    {"name": "Histórico",     "description": "Histórico unificado de conversas e anotações"},
    {"name": "Admin",         "description": "Endpoints administrativos (requerem ADMIN_KEY)"},
]

app = FastAPI(
    title="Shello API",
    description="""
    ## API do Shello — Assistente Pessoal Inteligente
    
    Esta API fornece todos os endpoints necessários para o aplicativo mobile Shello.
    
    ### Autenticação
    Todos os endpoints (exceto `/health` e `/auth/*`) requerem um token JWT no header:
    ```
    Authorization: Bearer <token>
    ```
    O token é obtido via `POST /auth/login` e expira em 7 dias.
    
    ### Códigos de status padrão
    | Código | Significado |
    |--------|-------------|
    | 200 | Sucesso |
    | 201 | Recurso criado |
    | 400 | Erro de negócio (ex: limite de mensagens atingido) |
    | 401 | Não autenticado |
    | 403 | Sem permissão para este recurso |
    | 422 | Dados de entrada inválidos |
    | 503 | Serviço externo indisponível (ex: LLM offline) |
    
    ### Rate limiting
    Autenticação usa rate limiting nativo do Supabase Auth.
    """,
    version="1.0.0",
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc"
)
```

**Modelos Pydantic com Field descriptions** — todos os campos devem ter `description` e `example`:

```python
class DiaryEntryCreate(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Conteúdo da anotação em texto plano. Sem formatação.",
        example="Hoje finalizei o módulo de autenticação. Amanhã começo o diário."
    )

class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Mensagem do usuário para o agente Shello.",
        example="Precisa criar uma tarefa para revisar o relatório até sexta"
    )

class TaskCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Título da tarefa. Obrigatório.",
        example="Revisar relatório de performance"
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Descrição opcional com mais detalhes da tarefa.",
        example="Focar nos indicadores de Q4 e comparar com Q3"
    )
    due_date: Optional[date] = Field(
        None,
        description="Data de vencimento opcional no formato YYYY-MM-DD. Quando criada via chat, sempre NULL.",
        example="2024-01-20"
    )

class UserPreferencesUpdate(BaseModel):
    formalidade: Optional[Literal["baixa", "media", "alta"]] = Field(
        None,
        description="Nível de formalidade do agente na comunicação. Afeta tom e vocabulário das respostas.",
        example="media"
    )
    nome_referencia: Optional[str] = Field(
        None,
        max_length=30,
        description="Como o agente deve chamar o usuário nas respostas.",
        example="Edu"
    )
    theme: Optional[Literal["light", "dark"]] = Field(
        None,
        description="Tema visual do aplicativo. Persistido no servidor e sincronizado entre dispositivos.",
        example="dark"
    )
```

**Respostas de erro padronizadas** — criar schema global de erro:

```python
class APIError(BaseModel):
    error: str = Field(..., description="Código de erro legível por máquina", example="LIMIT_EXCEEDED")
    message: str = Field(..., description="Mensagem legível por humano para exibir na UI", example="Limite de 20 mensagens atingido. Inicie uma nova conversa.")
    detail: Optional[Any] = Field(None, description="Detalhes adicionais do erro, quando disponível")

# Usar em todos os endpoints:
responses={
    400: {"model": APIError, "description": "Erro de regra de negócio"},
    401: {"model": APIError, "description": "Não autenticado"},
    403: {"model": APIError, "description": "Sem permissão"},
    503: {"model": APIError, "description": "Serviço externo indisponível"},
}
```

---

### PARTE 2 — Documentação de Código (Docstrings)

**Padrão obrigatório para classes:**
```python
class ChatService:
    """
    Serviço responsável por toda a lógica de negócio do chat com o agente Shello.
    
    Orquestra o fluxo completo de uma mensagem:
    1. Validação de limite de mensagens por conversa
    2. Busca de contexto (fragmentos ativos do usuário)
    3. Detecção de modo (PRATICO ou PADRAO)
    4. Montagem do prompt de 6 blocos
    5. Chamada ao LLM via LLMProvider
    6. Moderação da resposta
    7. Persistência das mensagens (apenas se aprovadas)
    
    Attributes:
        repository: ChatRepository para acesso ao banco de dados
        llm_provider: LLMProvider para chamadas ao modelo de linguagem
        context_repo: ContextRepository para buscar fragmentos do usuário
        cost_tracker: CostTracker para monitorar custos de tokens
    
    Raises:
        ValueError: Quando o limite de 20 mensagens por conversa é atingido
        LLMProviderError: Propagado quando o LLM está indisponível (resulta em HTTP 503)
    """
```

**Padrão obrigatório para métodos:**
```python
async def send(
    self,
    user_id: str,
    message: str,
    conversation_id: Optional[str] = None
) -> ChatResponse:
    """
    Processa uma mensagem do usuário e retorna a resposta do agente.
    
    Fluxo completo:
    1. Busca ou cria conversa ativa para o usuário
    2. Verifica se message_count < 20 (limite por conversa)
    3. Carrega até 20 fragmentos de contexto ativos (ORDER BY created_at ASC)
    4. Carrega histórico da conversa atual (truncado a 1.500 tokens)
    5. Detecta modo via detect_mode(message)
    6. Monta prompt de 6 blocos via PromptBuilder
    7. Chama LLMProvider.generate()
    8. Chama LLMProvider.moderate(response)
    9a. Se BLOQUEADO: retorna {"blocked": True} sem salvar no banco
    9b. Se APROVADO: salva mensagens user + assistant, incrementa message_count
    
    Args:
        user_id: UUID do usuário autenticado (extraído do JWT pelo controller)
        message: Texto da mensagem enviada pelo usuário (máx 2.000 chars)
        conversation_id: UUID da conversa a continuar. Se None, busca/cria conversa ativa.
    
    Returns:
        ChatResponse com campos:
        - response: Texto da resposta do agente (ou mensagem de erro se bloqueada)
        - mode: "PRATICO" ou "PADRAO"
        - blocked: True se a moderação bloqueou a resposta
        - conversation_id: UUID da conversa usada/criada
        - message_count: Número atual de mensagens na conversa
        - suggest_task: TaskSuggestion preenchida se modo PRATICO detectar pedido de tarefa
    
    Raises:
        ValueError: Se message_count >= 20 na conversa ativa
        LLMProviderError: Se o LLM estiver indisponível (propagado para HTTP 503)
    
    Example:
        response = await chat_service.send(
            user_id="550e8400-...",
            message="cria uma tarefa pra revisar o relatório"
        )
        # response.mode == "PRATICO"
        # response.suggest_task.title == "Revisar o relatório"
    """
```

---

### PARTE 3 — README da API

Criar `backend/README.md` com as seguintes seções. Este documento é o ponto de entrada para qualquer dev (especialmente o de frontend):

```markdown
# Shello API — Backend

FastAPI + Python 3.12 | Supabase | OpenAI GPT-4o-mini

## Rodando localmente

cp .env.example .env
# Preencha as variáveis no .env
make backend

API disponível em: http://localhost:8000
Swagger UI:        http://localhost:8000/docs
ReDoc:             http://localhost:8000/redoc

## Autenticação

Todos os endpoints (exceto /health e /auth/*) requerem JWT:

Authorization: Bearer <token>

O token é obtido via POST /auth/login.
Expira em 7 dias. Renovação: POST /auth/refresh.

## Endpoints resumidos

### Auth
POST   /auth/register          Cadastrar novo usuário
POST   /auth/login             Login → retorna JWT em cookie HTTPOnly
POST   /auth/logout            Invalidar sessão
POST   /auth/password/reset    Solicitar reset de senha
POST   /auth/onboarding        Enviar respostas do onboarding (obrigatório pós-cadastro)

### Diário
POST   /api/diary              Criar anotação
GET    /api/diary              Listar anotações paginadas (?page=1)
PUT    /api/diary/{id}         Editar anotação
DELETE /api/diary/{id}         Excluir anotação
GET    /api/diary/search       Buscar (?q=palavra)

### Tarefas
POST   /api/tasks              Criar tarefa manualmente
GET    /api/tasks              Listar tarefas (?status=pending|done)
PUT    /api/tasks/{id}         Editar tarefa
PATCH  /api/tasks/{id}/status  Alternar pending ↔ done
DELETE /api/tasks/{id}         Excluir tarefa
POST   /api/tasks/from-chat    Criar tarefa confirmada via chat (due_date sempre null)

### Chat
POST   /api/chat               Enviar mensagem → receber resposta do agente
GET    /api/chat/conversations  Listar conversas do usuário
DELETE /api/chat/conversations/{id} Arquivar conversa

### Contexto
GET    /api/context            Listar fragmentos ativos por categoria
DELETE /api/context/{id}       Remover fragmento permanentemente

### Configurações
GET    /api/users/me           Perfil do usuário autenticado
PUT    /api/users/preferences  Atualizar formalidade + nome_referencia + theme
PUT    /api/users/password     Alterar senha

### Histórico
GET    /api/history            Histórico unificado (?type=conversation|diary&q=palavra&page=1)

### Admin
GET    /admin/rls-check        Validar RLS de todas as tabelas (requer ADMIN_KEY header)

## Variáveis de ambiente

| Variável        | Obrigatória | Descrição |
|-----------------|-------------|-----------|
| SUPABASE_URL    | ✅ | URL do projeto Supabase |
| SUPABASE_KEY    | ✅ | Chave anon do Supabase |
| SECRET_KEY      | ✅ | Chave para assinar JWT (min 32 chars) |
| OPENAI_API_KEY  | ✅ | Chave da API OpenAI |
| ENVIRONMENT     | ✅ | development | production |
| SENTRY_DSN      | ❌ | DSN do Sentry para monitoramento de erros |
| ADMIN_KEY       | ❌ | Chave para endpoints administrativos |

## Arquitetura

controllers/ → recebem e respondem (sem lógica)
services/    → lógica de negócio pura (testável sem banco)
repositories/→ queries ao Supabase
models/      → schemas Pydantic de entrada e saída
core/        → config, segurança, LLM, agendamento

## Rodando os testes

pytest --tb=short -v

## Para o dev de Frontend

- Swagger completo: http://localhost:8000/docs
- Todos os endpoints têm exemplos de request e response documentados
- Erros sempre retornam JSON: {"error": "CODIGO", "message": "Mensagem legível"}
- Autenticação via cookie HTTPOnly (automático no browser/app) ou header Authorization
- Em caso de dúvida sobre qualquer endpoint, consulte o Swagger antes de perguntar
```

---

## CHECKLIST FINAL

Antes de declarar o backend completo:

- [ ] `pytest` rodando com 0 falhas
- [ ] `uvicorn app.main:app --reload` sobe sem erros
- [ ] `GET /health` retorna `{"status": "ok"}`
- [ ] `GET /admin/rls-check` retorna `{"status": "ok"}`
- [ ] Nenhuma lógica de negócio em controllers (revisão manual)
- [ ] Nenhuma query direta em services (revisão manual)
- [ ] `OPENAI_API_KEY` nunca aparece em logs
- [ ] Todos os erros retornam JSON estruturado (nunca stacktrace)
- [ ] `CostTracker` logando em todas as chamadas LLM
- [ ] Job de auto-arquivo ativo no startup

---

## DEPENDÊNCIAS (requirements.txt)

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.0
pydantic-settings==2.2.1
supabase==2.4.0
python-jose[cryptography]==3.3.0
bcrypt==4.1.3
openai==1.30.0
apscheduler==3.10.4
python-dotenv==1.0.1
sentry-sdk[fastapi]==1.45.0
pytest==8.2.0
pytest-asyncio==0.23.6
pytest-mock==3.14.0
httpx==0.27.0
```

---

## VARIÁVEIS DE AMBIENTE (.env.example)

```
SUPABASE_URL=
SUPABASE_KEY=
SECRET_KEY=
ENVIRONMENT=development
OPENAI_API_KEY=
SENTRY_DSN=
ADMIN_KEY=
```

---

## ⚠️ VERIFICAÇÃO FINAL OBRIGATÓRIA

> **Esta seção deve ser executada APÓS todas as 9 tasks concluídas.**
> Execute cada verificação na ordem. Se qualquer item falhar, **PARE, corrija e revalide antes de continuar.**
> Ao final, gere um relatório com o status de cada bloco.

---

### BLOCO 1 — TDD: Ciclo Red/Green/Refactor

```
VERIFICAR:
```
- [ ] **RED confirmado em todas as tasks:** para cada task, existe evidência (log ou comentário) de que os testes falharam antes da implementação
- [ ] **GREEN em todas as tasks:** `pytest` roda com 0 falhas e 0 erros
- [ ] **REFACTOR realizado:** nenhuma duplicação de lógica entre services, nenhum método com mais de 30 linhas sem justificativa
- [ ] **Cobertura mínima:** cada service tem ao menos 3 testes de unidade; cada controller tem ao menos 1 teste de integração
- [ ] **Mocks corretos:** Supabase e OpenAI são mockados em 100% dos testes de unidade — nenhum teste de unidade faz chamada real a API externa

```
COMANDO DE VALIDAÇÃO — rode e confirme saída sem falhas:
  pytest --tb=short -v
```

> 🚨 ALERTA: Se `pytest` retornar qualquer FAILED ou ERROR, liste os testes com falha, corrija e revalide antes de avançar.

---

### BLOCO 2 — POO: Separação de Camadas

```
VERIFICAR manualmente em cada arquivo:
```
- [ ] **Controllers:** nenhum arquivo em `controllers/` contém `if`, `for`, cálculo ou acesso ao banco. Apenas recebe request, chama service, retorna response
- [ ] **Services:** nenhum arquivo em `services/` importa `supabase` diretamente. Toda persistência passa pelo repository injetado
- [ ] **Repositories:** nenhum arquivo em `repositories/` contém regra de negócio (validação, cálculo, decisão). Apenas queries
- [ ] **Models:** todos os schemas de entrada têm validação Pydantic (`Field`, `min_length`, `max_length`, `validator` onde necessário)
- [ ] **Injeção de dependência:** services e repositories são injetados via `Depends()` — nenhuma instância criada com `= ServiceClass()` dentro de uma função de controller

```
COMANDO DE VALIDAÇÃO — não deve retornar nada:
  grep -rn "supabase" app/services/
  grep -rn "from supabase" app/controllers/
```

> 🚨 ALERTA: Se qualquer grep acima retornar resultados, há acoplamento indevido. Mova a lógica para a camada correta.

---

### BLOCO 3 — Tasks: Critérios de Aceitação por Task

#### TASK 1 — SCRUM-22 | RLS
- [ ] `GET /admin/rls-check` retorna `{"status": "ok", "tables": [...]}` com 7 tabelas listadas
- [ ] Todas as 7 tabelas validadas: `users`, `diary_entries`, `tasks`, `conversations`, `messages`, `context_fragments`, `onboarding_answers`
- [ ] Acesso com `ADMIN_KEY` errada retorna HTTP 403

> 🚨 ALERTA: Se qualquer tabela retornar `"isolated": false`, o RLS não está configurado corretamente no Supabase. Verifique as policies antes de continuar.

#### TASK 2 — SCRUM-23 | CRUD Diário
- [ ] `POST /api/diary` com conteúdo vazio retorna HTTP 422
- [ ] `POST /api/diary` com conteúdo válido retorna HTTP 201 e o objeto criado
- [ ] `GET /api/diary` retorna lista paginada com campo `date_group`
- [ ] `PUT /api/diary/{id}` de outro usuário retorna HTTP 403
- [ ] `DELETE /api/diary/{id}` de outro usuário retorna HTTP 403
- [ ] `GET /api/diary/search?q=palavra` retorna resultados filtrados
- [ ] `POST /api/diary` com conteúdo > 100 chars dispara extração assíncrona (verificar log)

```
COMANDO DE VALIDAÇÃO:
  curl -X POST /api/diary -d '{"content":""}' → esperado 422
  curl -X POST /api/diary -d '{"content":"texto válido"}' → esperado 201
```

> 🚨 ALERTA: Se `DELETE` ou `PUT` de outro usuário retornar 200 ou 404 ao invés de 403, o RLS ou a validação de ownership no service está faltando.

#### TASK 3 — SCRUM-28 | LLMProvider
- [ ] `OpenAIProvider` instancia sem erros com `api_key` de teste
- [ ] Chamada ao `generate()` usa exatamente o modelo `gpt-4o-mini-2024-07-18` (verificar nos logs)
- [ ] Temperatura `0.7` aparece em todas as chamadas (verificar nos logs)
- [ ] Simulação de falha da API lança `LLMProviderError` (verificar no teste)
- [ ] `OPENAI_API_KEY` não aparece em nenhum log (busca manual nos logs)

```
COMANDO DE VALIDAÇÃO:
  grep -rn "OPENAI_API_KEY" app/ → não deve retornar nenhuma linha com o valor real
  grep -rn "gpt-4o-mini" app/core/llm/ → deve aparecer exatamente 1 vez
  grep -rn "latest" app/core/llm/ → não deve retornar nada
```

> 🚨 ALERTA: Se `grep -rn "latest"` retornar qualquer resultado em `llm/`, o modelo não está fixado. Corrija imediatamente — modelo dinâmico causa custos imprevisíveis.

#### TASK 4 — SCRUM-31 | Chat
- [ ] `POST /api/chat` sem token retorna HTTP 401
- [ ] `POST /api/chat` com mensagem válida retorna HTTP 200 com campo `response`
- [ ] `POST /api/chat` após 20 mensagens retorna HTTP 400 com mensagem de limite
- [ ] Resposta bloqueada pela moderação: retorna `{"blocked": true}` e NÃO salva no banco (verificar contagem de mensagens)
- [ ] Falha do LLM retorna HTTP 503 e não quebra Diário ou ToDo
- [ ] Modo detectado aparece no campo `mode` da resposta
- [ ] Job de auto-arquivo está registrado e ativo (verificar log de startup)
- [ ] Prompt de 6 blocos montado corretamente (verificar nos logs de debug)

```
COMANDO DE VALIDAÇÃO:
  grep -n "scheduler" app/main.py → deve aparecer inicialização do scheduler
  grep -n "archive_inactive" app/core/scheduler.py → deve existir o método
```

> 🚨 ALERTA: Se o job de auto-arquivo não aparecer nos logs de startup, as conversas nunca serão arquivadas automaticamente.

#### TASK 5 — SCRUM-33 | Extração do Diário
- [ ] Extração chamada assincronamente após `POST /api/diary` com > 100 chars (não bloqueia resposta)
- [ ] Fragmentos salvos com `is_active=False`
- [ ] JSON inválido do LLM não lança exceção e não quebra o sistema
- [ ] Tokens consumidos logados após cada extração
- [ ] `derived_from_conversation_id` é `NULL` para fragmentos do diário

```
COMANDO DE VALIDAÇÃO:
  grep -n "is_active" app/services/extraction_service.py → deve aparecer False
  grep -n "create_task" app/services/diary_service.py → deve aparecer chamada assíncrona
```

> 🚨 ALERTA: Se a extração for chamada com `await` ao invés de `asyncio.create_task()`, ela está bloqueando a resposta do diário. Corrija para chamada assíncrona.

#### TASK 6 — SCRUM-40 | Custo de Tokens
- [ ] `CostTracker.calculate_cost(1000, 500)` retorna aproximadamente `$0.00045`
- [ ] Log de custo aparece após cada chamada ao LLM (chat e extração)
- [ ] Log de alerta `[COST ALERT]` aparece quando custo diário simulado > $0.50
- [ ] `CostTracker` é chamado tanto em `OpenAIProvider.generate()` quanto em `ExtractionService`

```
COMANDO DE VALIDAÇÃO:
  grep -rn "log_and_check" app/ → deve aparecer em openai_provider.py E em extraction_service.py
  grep -rn "COST ALERT" app/ → deve existir a string no código de alerta
```

> 🚨 ALERTA: Se `log_and_check` aparecer em apenas um dos arquivos, o monitoramento de custo está incompleto.

#### TASK 7 — SCRUM-41 | Histórico Unificado
- [ ] `GET /api/history` retorna lista com itens de `type: "conversation"` e `type: "diary"`
- [ ] `GET /api/history?type=conversation` retorna apenas conversas
- [ ] `GET /api/history?type=diary` retorna apenas anotações
- [ ] `GET /api/history?q=palavra` retorna apenas itens com a palavra no conteúdo
- [ ] Itens ordenados por `created_at DESC`
- [ ] Resposta contém `total`, `page`, `page_size`, `has_more`
- [ ] Queries de conversas e diário são feitas em paralelo via `asyncio.gather` (verificar no código)

```
COMANDO DE VALIDAÇÃO:
  grep -n "asyncio.gather" app/services/history_service.py → deve aparecer
  curl /api/history?type=conversation → todos os itens devem ter "type": "conversation"
  curl /api/history?type=diary → todos os itens devem ter "type": "diary"
```

> 🚨 ALERTA: Se `asyncio.gather` não estiver presente no `HistoryService`, as queries são sequenciais e podem comprometer a performance.

#### TASK 8 — SCRUM-38 | Criação de tarefa via chat (backend)
- [ ] `POST /api/tasks/from-chat` com título válido retorna HTTP 201
- [ ] `due_date` é sempre `null` na resposta — sem exceções
- [ ] Chamada com título vazio retorna HTTP 422
- [ ] Chamada sem autenticação retorna HTTP 401
- [ ] Múltiplas tarefas (até 3) criadas em uma única chamada
- [ ] Endpoint reutiliza `TaskService.create()` internamente

```
COMANDO DE VALIDAÇÃO:
  grep -n "TaskService" app/controllers/tasks_controller.py → deve aparecer from-chat reutilizando o service base
  curl -X POST /api/tasks/from-chat -d '{"title":"Teste"}' → due_date deve ser null na resposta
```

> 🚨 ALERTA: Se `due_date` vier preenchido em qualquer resposta do `/api/tasks/from-chat`, a regra D06 do MVP está sendo violada. Corrija imediatamente.

#### TASK 9 — SCRUM-39 | Preferências e senha (backend)
- [ ] `PUT /api/users/preferences` com `formalidade: "alta"` retorna 200 e persiste no banco
- [ ] `PUT /api/users/preferences` com formalidade inválida retorna 422
- [ ] `PUT /api/users/preferences` com `nome_referencia` > 30 chars retorna 422
- [ ] `PUT /api/users/password` com senha atual correta retorna 200
- [ ] `PUT /api/users/password` com senha atual errada retorna 401
- [ ] `PUT /api/users/password` com nova senha < 8 chars retorna 422
- [ ] Preferências refletidas nas respostas do chat (agente usa formalidade e nome_referencia atualizados)

```
COMANDO DE VALIDAÇÃO:
  curl -X PUT /api/users/preferences -d '{"formalidade":"invalida"}' → esperado 422
  curl -X PUT /api/users/password -d '{"current_password":"errada","new_password":"nova123"}' → esperado 401
```

> 🚨 ALERTA: Se a formalidade atualizada não refletir nas respostas do chat, o `ChatService` não está relendo as preferências do usuário a cada chamada. Verifique a query no `ChatRepository`.

---

### BLOCO 6 — Documentação

- [ ] **Swagger acessível:** `GET /docs` retorna a UI do Swagger sem erros
- [ ] **Todos os endpoints documentados:** nenhum endpoint aparece no Swagger sem `summary` e `description`
- [ ] **Tags organizadas:** todos os endpoints estão agrupados nas tags corretas (Auth, Diário, Tarefas, Chat, Contexto, Configurações, Histórico, Admin)
- [ ] **Exemplos presentes:** todos os modelos Pydantic têm `example` em pelo menos um campo
- [ ] **Respostas de erro documentadas:** 401, 403, 422 documentados em todos os endpoints que os retornam
- [ ] **Schema `APIError` definido** e usado como `response_model` nos erros 400, 401, 403, 503
- [ ] **README.md criado** em `backend/` com tabela de todos os endpoints e instruções de setup
- [ ] **Docstrings completos:** todas as classes de service e todos os métodos públicos têm docstring com Args, Returns e Raises

```
COMANDOS DE VALIDAÇÃO:
  curl http://localhost:8000/docs → deve retornar HTML da Swagger UI
  curl http://localhost:8000/openapi.json | python -m json.tool | grep -c '"summary"'
  # O número retornado deve ser igual ao número de endpoints implementados
  
  grep -rn '"""' app/services/ | wc -l
  # Deve haver docstrings em todos os métodos públicos dos services
```

> 🚨 ALERTA: Se qualquer endpoint aparecer no Swagger sem `summary`, `description` ou exemplos, o dev de frontend ficará bloqueado. Documente antes de considerar o endpoint concluído.

---

### BLOCO 4 — Segurança e Boas Práticas

- [ ] Arquivo `.env` não existe no repositório (`git status` não lista `.env`)
- [ ] `.gitignore` contém `.env` na lista de ignorados
- [ ] Nenhum `print()` de dados sensíveis no código (busca por `print(` em `app/`)
- [ ] Todos os endpoints autenticados retornam HTTP 401 sem token (testar manualmente 3 endpoints)
- [ ] Nenhum endpoint retorna stacktrace Python em produção (`ENVIRONMENT=production` no .env de teste)
- [ ] `SECRET_KEY` é uma string longa e aleatória no `.env` (mínimo 32 caracteres)

```
COMANDOS DE VALIDAÇÃO:
  git status | grep ".env" → não deve aparecer .env como arquivo rastreado
  grep -rn "print(" app/ → revisar qualquer resultado manualmente
  grep -n "SECRET_KEY" .env → confirmar que o valor tem >= 32 chars
```

> 🚨 ALERTA: Se `.env` aparecer no `git status`, rode `git rm --cached .env` imediatamente e adicione ao `.gitignore`.

---

### BLOCO 5 — Performance e Estabilidade

- [ ] `GET /api/diary` (20 itens) responde em menos de 1,5s (medir com `time curl`)
- [ ] `GET /api/history` (20 itens) responde em menos de 1,5s (medir com `time curl`)
- [ ] `POST /api/chat` responde em menos de 8s em P95 (latência aceitável incluindo LLM)
- [ ] Servidor não crasha após 10 requisições consecutivas ao `/api/chat`
- [ ] `uvicorn` não exibe `DeprecationWarning` nem `RuntimeWarning` no startup

```
COMANDOS DE VALIDAÇÃO:
  time curl -X GET /api/diary -H "Authorization: Bearer {token}"
  time curl -X GET /api/history -H "Authorization: Bearer {token}"
  for i in {1..10}; do curl -X POST /api/chat -d '{"message":"teste"}' -H "Authorization: Bearer {token}"; done
```

> 🚨 ALERTA: Se qualquer endpoint demorar mais que o limite, investigue queries N+1 no repository ou falta de índice no Supabase.

---

### RELATÓRIO FINAL

Ao concluir todos os blocos acima, gere um relatório no seguinte formato:

```
════════════════════════════════════════════════
RELATÓRIO DE CONCLUSÃO — Backend Shello
Eduardo Neves de Souza
════════════════════════════════════════════════

BLOCO 1 — TDD                       [ PASSOU / FALHOU ]
BLOCO 2 — POO/Camadas               [ PASSOU / FALHOU ]
BLOCO 3 — Tasks
  TASK 1  SCRUM-22  RLS             [ PASSOU / FALHOU ]
  TASK 2  SCRUM-23  Diário          [ PASSOU / FALHOU ]
  TASK 3  SCRUM-28  LLMProvider     [ PASSOU / FALHOU ]
  TASK 4  SCRUM-31  Chat            [ PASSOU / FALHOU ]
  TASK 5  SCRUM-33  Extração        [ PASSOU / FALHOU ]
  TASK 6  SCRUM-40  Custo           [ PASSOU / FALHOU ]
  TASK 7  SCRUM-41  Histórico       [ PASSOU / FALHOU ]
  TASK 8  SCRUM-38  Task via chat   [ PASSOU / FALHOU ]
  TASK 9  SCRUM-39  Configurações   [ PASSOU / FALHOU ]
BLOCO 4 — Segurança                 [ PASSOU / FALHOU ]
BLOCO 5 — Performance               [ PASSOU / FALHOU ]
BLOCO 6 — Documentação              [ PASSOU / FALHOU ]

RESULTADO GERAL: [ ✅ BACKEND CONCLUÍDO / ❌ PENDÊNCIAS ENCONTRADAS ]

Pendências (se houver):
- [ lista de itens que falharam com descrição do problema e ação corretiva ]

Swagger disponível em: http://localhost:8000/docs
ReDoc disponível em:   http://localhost:8000/redoc
════════════════════════════════════════════════
```

> **O backend só está concluído quando o RESULTADO GERAL for ✅ BACKEND CONCLUÍDO.**
> Qualquer ❌ no relatório deve ser corrigido antes de considerar a task encerrada.
