# Stack Tecnológica — Shello

> Referência completa da stack do projeto. Versões fixas garantem builds reproduzíveis.
> Atualizações de dependências críticas requerem testes de regressão e, se houver mudança de comportamento, um ADR.

---

## Frontend

| Camada | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Framework UI | React Native | 0.76.x (via Expo) | Desenvolvimento cross-platform (iOS + Android) com único codebase |
| Linguagem | TypeScript | 5.x | Tipagem estática, melhor DX e prevenção de erros em runtime |
| Plataforma de desenvolvimento | Expo SDK | 54 | Gerenciamento simplificado de builds, OTA updates, EAS |
| Navegação | React Navigation | 7.x | Solução padrão de navegação para React Native |
| Cliente HTTP | Axios | 1.x | Interceptors para JWT automático, melhor DX que fetch nativo |
| Build nativo | EAS Build | — | Builds na nuvem sem necessidade de Mac local para iOS |

---

## Backend

| Camada | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Framework web | FastAPI | 0.111.x | Alta performance, tipagem via Pydantic, geração automática de OpenAPI |
| Linguagem | Python | 3.12 | Suporte moderno a `asyncio`, tipagem com TypeAlias, melhor performance |
| Servidor ASGI | Uvicorn | 0.29.x | Servidor assíncrono de alta performance, compatível com FastAPI |
| Validação/Schemas | Pydantic | v2 | Validação de dados rápida com decorators nativos do Python |
| Autenticação JWT | python-jose | 3.x | Geração e validação de JWT |
| Hashing de senha | bcrypt | 4.x | Hashing seguro de senhas (via passlib) |
| Task scheduler | APScheduler | 3.x | Jobs recorrentes (ex.: arquivamento de conversas a cada 15min) |

---

## Banco de Dados e Auth

| Camada | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Banco de dados | PostgreSQL | 15 (via Supabase) | Banco relacional robusto, suporte nativo a RLS |
| Plataforma gerenciada | Supabase | — | PostgreSQL gerenciado + RLS + Auth + SDK Python/JS |
| Segurança de dados | Row Level Security (RLS) | — | Isolamento de dados por usuário no nível do banco |
| Autenticação | Supabase Auth | — | Gerenciamento de usuários, JWTs, sessões |

---

## Inteligência Artificial

| Componente | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| LLM | OpenAI gpt-4o-mini | `2024-07-18` (fixo) | Custo-benefício ideal para assistente pessoal |
| SDK | openai (Python) | 1.x | SDK oficial, suporte a async |
| Temperatura | `0.7` (fixa) | — | Equilíbrio entre criatividade e determinismo |
| Modelo (snapshot) | `gpt-4o-mini-2024-07-18` | — | Snapshot fixo para comportamento previsível em testes |

> **Ver:** [ADR-002](../adr/ADR-002-llm-model-fixed.md) — justificativa para fixar modelo e temperatura.

---

## Testes

| Ferramenta | Versão | Finalidade |
|---|---|---|
| pytest | 8.x | Framework de testes principal |
| pytest-asyncio | 0.23.x | Suporte a testes assíncronos (`async def`) |
| httpx | 0.27.x | Cliente HTTP para testes de integração ASGI |
| pytest-mock | 3.x | Fixtures de mocking (`mocker`) |
| pytest-cov | 5.x | Relatórios de cobertura de código |

---

## Infraestrutura e Deploy

| Componente | Tecnologia | Justificativa |
|---|---|---|
| Containerização | Docker | Ambiente reproduzível local e em CI |
| Deploy do backend | Railway | Deploy simples via Git push, variáveis de ambiente gerenciadas |
| Build do app mobile | EAS Build (Expo) | Builds iOS/Android na nuvem |
| CI/CD | Railway (auto-deploy na `main`) | Simplicidade para projeto pessoal |

---

## Monitoramento e Observabilidade

| Componente | Tecnologia | Finalidade |
|---|---|---|
| Error tracking | Sentry | Captura de exceções em produção (backend + frontend) |
| Jobs recorrentes | APScheduler | Execução de tasks (archiving job a cada 15min) |
| Cost tracking | CostTracker (interno) | Monitoramento de custo de tokens por usuário/dia |

---

## Decisões de Stack

Para justificativas detalhadas, consulte os ADRs:

- [ADR-001](../adr/ADR-001-fastapi-supabase.md) — FastAPI + Supabase como backend
- [ADR-002](../adr/ADR-002-llm-model-fixed.md) — Modelo LLM fixo
- [ADR-003](../adr/ADR-003-tdd-mandatory.md) — TDD obrigatório
