# agents.md — Backend | Shello

> Leia este arquivo ao trabalhar em qualquer parte do backend.
> Para contexto global do projeto, consulte primeiro `agents.md` na raiz.

---

## O que é este módulo?

O backend é uma API REST construída com **FastAPI + Python 3.12**. Ele recebe requisições do app mobile (React Native), processa a lógica de negócio e persiste dados no Supabase. Também integra com OpenAI para o chat com o agente Shello.

---

## Estrutura de diretórios

```
backend/
├── app/
│   ├── api/v1/             # Rotas de auth, onboarding e contexto (cookie-based)
│   │   └── agents.md
│   ├── controllers/        # FastAPI routers — recebem e respondem. Zero lógica.
│   │   └── agents.md
│   ├── services/           # Lógica de negócio pura. Testável sem banco.
│   │   └── agents.md
│   ├── repositories/       # Queries ao Supabase. Mockadas nos testes.
│   │   └── agents.md
│   ├── schemas/            # Schemas Pydantic de request/response
│   │   └── agents.md
│   ├── core/               # Config, segurança, LLM, agendamento
│   │   └── agents.md
│   └── main.py             # Entry point da aplicação FastAPI
├── tests/                  # Testes pytest
│   └── agents.md
├── Dockerfile
├── requirements.txt
└── .env                    # Nunca commitado
```

---

## Fluxo de uma requisição

```
HTTP Request
     │
     ▼
Controller (app/controllers/ ou app/api/)
     │   — valida entrada via Pydantic
     │   — extrai user do JWT
     ▼
Service (app/services/)
     │   — aplica regras de negócio
     │   — chama Repository(ies)
     ▼
Repository (app/repositories/)
     │   — executa query no Supabase
     ▼
Supabase (PostgreSQL + RLS)
```

---

## Módulos e responsabilidades

| Módulo           | Arquivo(s) principais                              | Responsabilidade                          |
|------------------|----------------------------------------------------|-------------------------------------------|
| Auth             | `api/v1/auth.py` + `services/auth_service.py`      | Login, register, logout, refresh token    |
| Onboarding       | `api/v1/onboarding.py` + `services/onboarding_service.py` | Coleta inicial de dados do usuário |
| Chat             | `controllers/chat_controller.py` + `services/chat_service.py` | Conversa com o agente Shello   |
| Diário           | `controllers/diary_controller.py` + `services/diary_service.py` | CRUD de anotações              |
| Tarefas          | `controllers/tasks_controller.py` + `services/task_service.py` | Gestão de tarefas (ToDo)        |
| Histórico        | `controllers/history_controller.py` + `services/history_service.py` | Histórico unificado        |
| Memórias         | `controllers/memories_controller.py` + `services/memory_service.py` | Fragmentos de contexto       |
| Usuário          | `controllers/user_controller.py` + `services/user_service.py` | Preferências e senha          |
| Rotinas          | `controllers/routines_controller.py` + `services/routine_service.py` | Rotinas do usuário           |
| Extração         | `services/extraction_service.py`                   | Extração assíncrona de contexto do diário |
| LLM              | `core/llm/`                                        | Abstração do provedor de linguagem        |
| CostTracker      | `core/cost_tracker.py`                             | Monitoramento de custo de tokens          |
| Scheduler        | `core/scheduler.py`                                | Jobs automáticos (arquivamento)           |
| RLS Validator    | `core/rls_validator.py`                            | Validação de Row Level Security           |
| PromptBuilder    | `core/prompt_builder.py`                           | Montagem do prompt de 6 blocos            |
| ModeDetector     | `core/mode_detector.py`                            | Detecta modo PRATICO vs PADRAO            |

---

## Como rodar localmente

```bash
# Na raiz do projeto
make backend

# API disponível em:
http://localhost:8000

# Swagger:
http://localhost:8000/docs

# Rodar testes:
cd backend && pytest --tb=short -v
```

---

## Variáveis de ambiente obrigatórias

| Variável        | Descrição                                            |
|-----------------|------------------------------------------------------|
| `SUPABASE_URL`  | URL do projeto Supabase                              |
| `SUPABASE_KEY`  | Chave anon do Supabase                               |
| `SECRET_KEY`    | Chave para assinar JWT (mínimo 32 chars)             |
| `OPENAI_API_KEY`| Chave da API OpenAI                                  |
| `ENVIRONMENT`   | `development` ou `production`                        |
| `ADMIN_KEY`     | Chave para endpoints administrativos (opcional)      |
| `SENTRY_DSN`    | DSN do Sentry para monitoramento (opcional)          |

---

## Regras críticas

- **Modelo LLM fixo**: `gpt-4o-mini-2024-07-18` — nunca dinâmico
- **Temperatura LLM fixa**: `0.7`
- **RLS ativo**: todas as 7 tabelas têm Row Level Security
- **Limite de conversa**: máximo 20 mensagens por conversa
- **Extração assíncrona**: diário > 100 chars dispara `asyncio.create_task()`, nunca `await`
- **`due_date` via chat**: sempre `null` — nunca parsear data de texto livre

---

## Referências
- `docs/standards/architecture.md` — Padrão de camadas
- `docs/product/business-rules.md` — Regras de negócio completas
- `docs/adr/` — Decisões arquiteturais
- `backend/app/controllers/agents.md` — Como implementar controllers
- `backend/app/services/agents.md` — Como implementar services
