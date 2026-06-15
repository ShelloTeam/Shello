# agents.md — Core

> **Módulo:** `backend/app/core/`
> **Papel:** Infraestrutura transversal — configuração, segurança, dependências, LLM, agendamento e monitoramento.

---

## Visão geral dos arquivos

| Arquivo/Pasta | Responsabilidade |
|---|---|
| `config.py` | Carrega variáveis de ambiente via pydantic-settings |
| `security.py` | JWT (python-jose) + hashing de senha (bcrypt) |
| `dependencies.py` | `Depends()` globais: `get_current_user`, `get_supabase` |
| `mode_detector.py` | Detecta modo PRATICO vs PADRAO por keywords |
| `prompt_builder.py` | Monta prompt de 7 blocos para o LLM |
| `cost_tracker.py` | Monitora custo OpenAI por usuário/dia |
| `scheduler.py` | APScheduler — arquiva conversas inativas a cada 15min |
| `rls_validator.py` | Valida RLS ativo nas 7 tabelas Supabase |
| `llm/base.py` | Classe abstrata `LLMProvider` |
| `llm/openai_provider.py` | Implementação concreta com `gpt-4o-mini-2024-07-18` |
| `llm/exceptions.py` | `LLMProviderError` |

---

## `config.py` — Configuração

Usa `pydantic-settings` para carregar e validar variáveis do `.env`:

```python
from app.core.config import settings, get_settings

settings.openai_api_key    # str
settings.supabase_url      # str
settings.supabase_key      # str
settings.secret_key        # str (para JWT)
settings.is_production     # bool — afeta cookies e exposição de dev_token
```

- `get_settings()` retorna instância cacheada via `lru_cache` — use-a em código que não pode usar `Depends()`
- `settings` (importação direta) é a mesma instância; use em `security.py` e outros módulos core
- **Nunca** hardcode valores de config — sempre via `settings`

---

## `security.py` — JWT + Bcrypt

### JWT

```python
from app.core.security import create_access_token, decode_access_token

# Criar token (expira em 7 dias por padrão)
token = create_access_token(data={"sub": user_id})

# Decodificar (retorna None se inválido/expirado)
payload = decode_access_token(token)
user_id = payload["sub"] if payload else None
```

- Algoritmo: **HS256** fixo
- Expiração: **7 dias** (`ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7`)
- Chave: `settings.secret_key`

### Hashing de senha

```python
from app.core.security import hash_password, verify_password

hashed = hash_password("senha_plain")       # bcrypt, 12 rounds
ok = verify_password("senha_plain", hashed) # bool
```

- `BCRYPT_ROUNDS = 12` — nunca diminuir (risco de segurança)

---

## `dependencies.py` — Dependências globais

Dois `Depends()` fundamentais usados em todo o backend:

### `get_current_user`

```python
from app.core.dependencies import get_current_user, User

# Em qualquer endpoint protegido:
current_user: User = Depends(get_current_user)
# current_user.id → str (UUID do usuário)
```

- Lê o header `Authorization: Bearer <token>`
- Em produção: decodifica via `jose.jwt.decode` com `settings.secret_key`
- Em testes: tokens mágicos mapeados diretamente:
  - `test-token` / `test-token-user-1` → `user-1`
  - `test-token-user-2` → `user-2`
- Lança HTTP 401 se ausente ou inválido

### `get_supabase`

```python
from app.core.dependencies import get_supabase

# Em factories de controllers/services:
def get_algum_service(db=Depends(get_supabase)) -> AlgumService:
    ...
```

- Retorna cliente Supabase real em produção
- Em testes: substituído via `app.dependency_overrides[get_supabase] = lambda: mock_db`

---

## `mode_detector.py` — Detecção de modo

```python
from app.core.mode_detector import detect_mode

mode = detect_mode("preciso criar uma tarefa")  # → "PRATICO"
mode = detect_mode("como você está?")           # → "PADRAO"
```

**Keywords que ativam PRATICO:**
```python
PRATICO_KEYWORDS = {
    "tarefa", "lembrar", "lembra", "agendar", "agenda", "criar",
    "cria", "adicionar", "adiciona", "todo", "to-do", "fazer",
    "compromisso", "prazo", "deadline",
}
```

- Case-insensitive (usa `.lower()`)
- Para adicionar keywords: edite o set `PRATICO_KEYWORDS` em `mode_detector.py`
- O modo é passado ao `PromptBuilder` e incluído no bloco `[MODO]` do prompt

---

## `prompt_builder.py` — Construção do prompt

O `PromptBuilder` monta o system prompt de **7 blocos** enviados ao LLM:

```
[IDENTIDADE]    → quem é o Shello, regra de usar o nome do usuário
[PARÂMETROS]    → formalidade, nome de referência
[PERFIL]        → respostas do onboarding (q1_name, q2_lifestyle, q3_goal)
[CONTEXTO]      → fragmentos de contexto/memórias ativos (até MAX_HISTORY_CHARS)
[MODO]          → "PRATICO" ou "PADRAO"
[HISTÓRICO]     → últimas mensagens da conversa (truncado em 6000 chars)
[MENSAGEM]      → a mensagem atual do usuário
```

```python
from app.core.prompt_builder import PromptBuilder

builder = PromptBuilder()
prompt = builder.build(
    user_name="Edu",
    formalidade="alta",
    fragments=[{"category": "trabalho", "content": "Trabalha com Python"}],
    history=[{"role": "user", "content": "Oi"}, {"role": "assistant", "content": "Olá!"}],
    mode="PADRAO",
    message="Como posso melhorar minha produtividade?",
    onboarding={"q1_name": "Edu", "q2_lifestyle": "remoto", "q3_goal": "aprender mais"},
)
```

**Regras:**
- `MAX_HISTORY_CHARS = 6000` (~1500 tokens): histórico truncado pelos turns mais recentes
- Se `onboarding` for `None` ou sem dados → bloco `[PERFIL]` diz "Ainda sem dados de perfil."
- Fragmentos vazios → `[CONTEXTO]` diz "Nenhum fragmento de contexto disponível."
- A REGRA ABSOLUTA no bloco `[IDENTIDADE]` instrui o modelo a nunca negar conhecimento dos dados fornecidos

---

## `cost_tracker.py` — Monitoramento de custo OpenAI

```python
from app.core.cost_tracker import CostTracker

tracker = CostTracker(repository=cost_repo)

# Cálculo puro (sem efeitos colaterais)
custo = tracker.calculate_cost(input_tokens=1000, output_tokens=500)
# → $0.000450

# Persiste e verifica alerta
await tracker.log_and_check(
    user_id="user-uuid",
    input_tokens=1000,
    output_tokens=500,
    operation="chat",
)
```

**Preços fixos (gpt-4o-mini):**

| Tipo | Preço |
|---|---|
| Input | $0.150 / 1M tokens |
| Output | $0.600 / 1M tokens |

**Alerta:** Se o custo diário de um usuário ultrapassar **$0.50**, um `logger.warning` é emitido com:
```
COST ALERT user=<id> daily_cost=<valor> threshold=0.50 operation=<op>
```

- Para alterar o threshold: edite `DAILY_ALERT_THRESHOLD` em `cost_tracker.py`
- Para alterar preços: edite `PRICE_INPUT_PER_M` / `PRICE_OUTPUT_PER_M`
- `calculate_cost()` é uma função pura — testável sem mocks

---

## `scheduler.py` — Agendamento de arquivamento

```python
from app.core.scheduler import ConversationScheduler
from app.repositories.chat_repository import ChatRepository

scheduler = ConversationScheduler(chat_repository=chat_repo)
scheduler.start()   # registra job e inicia APScheduler
scheduler.stop()    # desliga sem aguardar jobs pendentes
```

**Comportamento:**
- Roda a cada **15 minutos**
- Arquiva conversas com `updated_at` mais antigo que **2 horas** (`status: "archived"`)
- Iniciado no `lifespan` de `main.py` junto com a aplicação

Para alterar a frequência: edite `minutes=15` em `scheduler.add_job(...)`.
Para alterar o timeout de inatividade: edite `timedelta(hours=2)` em `_archive_inactive`.

---

## `rls_validator.py` — Validação de RLS

```python
from app.core.rls_validator import RLSValidator

validator = RLSValidator(db=supabase_client)
result = await validator.validate_all()
# → {"status": "ok", "tables": [{"table": "tasks", "isolated": True}, ...]}
```

**Tabelas validadas (7):**
`users`, `diary_entries`, `tasks`, `conversations`, `messages`, `context_fragments`, `onboarding_answers`

**Método:** faz query com `.neq("user_id", "rls-sentinel-user-id")` em cada tabela.
- Se retornar dados → RLS não está isolando → `isolated: False`
- Se não retornar nada → RLS funcionando → `isolated: True`
- Exceção na query → assume `isolated: True` (conservador)

---

## `llm/` — Abstração de LLM

### `base.py` — Contrato

```python
class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, system_prompt: str, history: list[dict], user_message: str) -> str: ...
    
    @abstractmethod
    async def moderate(self, content: str) -> bool: ...
```

Para implementar um novo provider (ex: Gemini, Anthropic):
1. Crie `llm/gemini_provider.py`
2. Herde de `LLMProvider`
3. Implemente `generate()` e `moderate()`
4. Envolva qualquer exceção do SDK em `LLMProviderError`

### `openai_provider.py` — Implementação atual

```python
class OpenAIProvider(LLMProvider):
    MODEL = "gpt-4o-mini-2024-07-18"  # NUNCA alterar para "latest" ou dinâmico
    TEMPERATURE = 0.7                  # NUNCA tornar configurável
```

- `generate()`: chama `chat.completions.create` com model e temperature fixos
- `moderate()`: chama `moderations.create` — retorna `True` se seguro, `False` se sinalizado
- Qualquer exceção do SDK OpenAI é capturada e relançada como `LLMProviderError`

### `exceptions.py` — Exceção do LLM

```python
from app.core.llm.exceptions import LLMProviderError
# Capturado nos controllers → HTTP 503
```

---

## Regras críticas do módulo core

1. **`MODEL` e `TEMPERATURE` são constantes imutáveis** — nunca tornar parâmetros de request
2. **JWT expira em 7 dias** — cookie e Bearer token seguem a mesma expiração
3. **bcrypt com 12 rounds** — nunca diminuir
4. **`get_supabase` deve ser sempre sobrescrito nos testes** — nunca deixar criar cliente real em CI
5. **`PromptBuilder` é stateless** — pode ser instanciado uma vez e reutilizado
6. **Scheduler é iniciado apenas uma vez** no `lifespan` — não instanciar múltiplas vezes
