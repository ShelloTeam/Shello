# ADR-001 — FastAPI + Supabase como Stack de Backend

## Status

`Accepted`

**Data:** 2026-01-01
**Autor(es):** Time Shello

---

## Contexto

O Shello é um assistente pessoal mobile que exige:

- **Isolamento de dados por usuário** — cada usuário só deve ver os próprios dados (diário, tarefas, conversas).
- **Autenticação gerenciada** — login/logout, JWTs, expiração de sessão sem implementar do zero.
- **Queries simples** — o acesso a dados do Shello é majoritariamente por `user_id`, sem joins complexos ou agregações sofisticadas.
- **Deploy simples** — projeto pessoal sem equipe de DevOps dedicada.
- **Desenvolvimento rápido** — API tipada, validação automática, documentação OpenAPI gerada.

A escolha do backend afeta diretamente: segurança dos dados, velocidade de desenvolvimento e custo operacional.

---

## Decisão

Adotamos **FastAPI** como framework web e **Supabase** como plataforma de banco de dados.

### FastAPI
- **Performance:** Baseado em Starlette + asyncio, é um dos frameworks Python mais rápidos disponíveis.
- **Tipagem:** Integração nativa com Pydantic v2 — validação de request/response declarativa.
- **DX:** Geração automática de documentação OpenAPI (Swagger UI + ReDoc) sem configuração adicional.
- **Async-first:** Suporte a `async/await` nativamente, essencial para I/O com OpenAI e Supabase sem bloquear o event loop.

### Supabase
- **PostgreSQL gerenciado:** Banco robusto e confiável, sem gestão de infraestrutura.
- **Row Level Security (RLS):** Políticas de segurança no nível do banco — mesmo que a aplicação tenha um bug, o banco não entrega dados de outro usuário.
- **Auth pronto:** Gerenciamento de usuários, tokens JWT, refresh tokens sem implementação customizada.
- **SDK Python:** Cliente oficial com interface fluente para queries, inserts e updates.
- **Custo:** Free tier generoso para um app pessoal com volume baixo de dados.

**Não usaremos ORM** (SQLAlchemy, Tortoise ORM, etc.) — as queries são feitas diretamente via Supabase SDK Python, que gera o SQL internamente.

---

## Consequências

### Positivas
- Isolamento de dados garantido em duas camadas: validação no service + RLS no banco.
- Zero gestão de infraestrutura de banco (backups, updates, SSL gerenciados pelo Supabase).
- Auth pronto — sem implementar refresh tokens, hashing de senha ou gestão de sessões.
- API documentada automaticamente via OpenAPI.
- Requests assíncronos nativos — sem bloqueio durante chamadas à OpenAI.

### Negativas / Trade-offs
- **Sem ORM:** Sem migrações automáticas via código (ex.: Alembic). Mudanças de schema são feitas via SQL no Supabase Dashboard ou via scripts de migração manuais.
- **Vendor lock-in:** A lógica de RLS está acoplada ao PostgreSQL/Supabase — migrar para outro banco exige reescrever as políticas de segurança.
- **Debugging de RLS:** Políticas mal configuradas são difíceis de debugar — requerem testes cuidadosos.
- **Supabase SDK limitado:** Queries complexas (window functions, CTEs) são mais difíceis de expressar via SDK — nesses casos, usar `.rpc()` ou SQL raw.

### Neutras / Observações
- O `SUPABASE_SERVICE_KEY` bypassa RLS — deve ser usado apenas no backend, nunca exposto ao frontend.
- A autenticação final (validação do JWT do usuário em cada request) é responsabilidade do backend FastAPI, não do Supabase Auth diretamente.

---

## Alternativas Consideradas

### Alternativa A: Django + Django REST Framework + PostgreSQL próprio
- **Por que descartada:** Overhead de configuração alto, ORM síncrono (requer adaptadores async), gerenciamento de banco de dados próprio (sem RLS nativo fácil de configurar). Mais adequado para sistemas complexos com muitas entidades relacionadas.

### Alternativa B: Node.js (Express/Fastify) + Supabase
- **Por que descartada:** O restante da IA/ML stack (OpenAI SDK, bibliotecas de NLP) tem melhor suporte em Python. Manter dois ecossistemas de linguagem aumenta a complexidade desnecessariamente.

### Alternativa C: Supabase Edge Functions (sem backend separado)
- **Por que descartada:** Edge Functions têm limitações de runtime (Deno, sem acesso a bibliotecas Python), dificultando integração com SDK da OpenAI e APScheduler para jobs recorrentes.
