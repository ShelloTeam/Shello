# agents.md — Guia Global do Agente | Shello

> Este arquivo é o ponto de entrada para qualquer agente de IA que trabalha neste repositório.
> Leia-o **antes de qualquer coisa**. Ele orienta onde encontrar cada informação e como executar tarefas.

---

## O que é o Shello?

O Shello é um assistente pessoal inteligente com chat IA, diário de anotações e gestão de tarefas. É um app mobile em React Native (Expo) com backend FastAPI, banco Supabase e IA via OpenAI `gpt-4o-mini`.

Fluxo de dados:
```
Celular (Expo Go / APK)
       │
       ▼
Railway (FastAPI) ──► OpenAI gpt-4o-mini
       │
       ▼
   Supabase (banco + auth)
```

---

## Onde encontrar cada coisa

### Documentação do produto e negócio
| O que você precisa                     | Onde está                                      |
|----------------------------------------|------------------------------------------------|
| Regras de negócio do produto           | `docs/product/business-rules.md`               |
| Decisões arquiteturais (ADRs)          | `docs/adr/`                                    |
| Padrões de código e convenções         | `docs/standards/`                              |
| Glossário de termos do domínio         | `docs/product/glossary.md`                     |
| Stack tecnológica completa             | `docs/tech/stack.md`                           |
| Variáveis de ambiente                  | `docs/tech/environment-variables.md`           |
| Guia de contribuição e Git flow        | `docs/standards/git-workflow.md`               |

### Código-fonte
| Módulo                        | Caminho                              | agents.md local                              |
|-------------------------------|--------------------------------------|----------------------------------------------|
| Backend (visão geral)         | `backend/`                           | `backend/agents.md`                          |
| Backend — Controllers         | `backend/app/controllers/`           | `backend/app/controllers/agents.md`          |
| Backend — Services            | `backend/app/services/`              | `backend/app/services/agents.md`             |
| Backend — Repositories        | `backend/app/repositories/`          | `backend/app/repositories/agents.md`         |
| Backend — Core (config, LLM)  | `backend/app/core/`                  | `backend/app/core/agents.md`                 |
| Backend — API v1 (auth)       | `backend/app/api/`                   | `backend/app/api/agents.md`                  |
| Backend — Schemas Pydantic    | `backend/app/schemas/`               | `backend/app/schemas/agents.md`              |
| Backend — Testes              | `backend/tests/`                     | `backend/tests/agents.md`                    |
| Frontend (visão geral)        | `frontend/`                          | `frontend/agents.md`                         |
| Frontend — Screens            | `frontend/src/screens/`              | `frontend/src/screens/agents.md`             |
| Frontend — Services (API)     | `frontend/src/services/`             | `frontend/src/services/agents.md`            |
| Frontend — Contexts           | `frontend/src/contexts/`             | `frontend/src/contexts/agents.md`            |
| Frontend — Navigation         | `frontend/src/navigation/`           | `frontend/src/navigation/agents.md`          |

---

## Metodologia obrigatória

### TDD — Red → Green → Refactor
Todo código de produção **deve** ter um teste falhando primeiro. Sem exceção.

```
1. RED    → Escreva o teste. Rode e confirme que FALHA.
2. GREEN  → Escreva o mínimo de código para passar.
3. REFACTOR → Melhore sem quebrar os testes.
```

### Arquitetura em camadas (POO)
```
Controller → Service → Repository → Supabase
```
- **Controller**: só recebe requisição e retorna resposta. Zero lógica.
- **Service**: lógica de negócio pura. Não acessa banco diretamente.
- **Repository**: queries ao Supabase. Não tem regras de negócio.

Detalhes completos: `docs/standards/architecture.md`

---

## Como executar tarefas

### Antes de começar qualquer task
1. Leia este arquivo (`agents.md` raiz)
2. Leia o `agents.md` do módulo relevante
3. Consulte `docs/product/business-rules.md` se a task envolve regras de negócio
4. Consulte `docs/adr/` se a decisão arquitetural já foi tomada

### Para implementar um endpoint novo (backend)
1. Leia `backend/agents.md`
2. Leia `backend/app/controllers/agents.md`
3. Verifique `docs/product/business-rules.md` para regras do domínio
4. Siga o ciclo TDD: teste primeiro em `backend/tests/`
5. Implemente na ordem: Repository → Service → Controller

### Para implementar uma tela nova (frontend)
1. Leia `frontend/agents.md`
2. Leia `frontend/src/screens/agents.md`
3. Verifique o endpoint correspondente no Swagger: `http://localhost:8000/docs`
4. Verifique `frontend/src/services/agents.md` para saber como chamar a API

### Para tomar uma decisão arquitetural
1. Verifique se já existe um ADR relevante em `docs/adr/`
2. Se não existir, crie um novo ADR seguindo o template em `docs/adr/template.md`
3. Documente a decisão **antes** de implementar

---

## Comandos essenciais

```bash
# Subir backend local
make backend

# Subir frontend (Expo)
make dev

# Rodar testes do backend
cd backend && pytest --tb=short -v

# Verificar tipos TypeScript do frontend
make check

# Derrubar containers
make down
```

---

## Regras inegociáveis

1. **Nunca commite `.env`** — segredos ficam no Railway ou local apenas
2. **Nunca escreva código de produção sem teste falhando primeiro** (TDD)
3. **Nunca acesse Supabase diretamente em Services** — use Repository
4. **Nunca coloque lógica em Controllers** — use Service
5. **Nunca use modelo LLM dinâmico** — o modelo é fixo: `gpt-4o-mini-2024-07-18`
6. **`due_date` de tarefas criadas via chat é sempre `null`** (regra D06 do MVP)
7. **Commits em Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`

---

## Referências rápidas

- Swagger local: `http://localhost:8000/docs`
- ReDoc local: `http://localhost:8000/redoc`
- README principal: `README.md`
- Documentação técnica completa: `docs/`
- CLAUDE.md (referência histórica do autor original): `CLAUDE.md`
