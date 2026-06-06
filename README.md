# Shello

Assistente pessoal inteligente com chat IA, diário e gestão de tarefas. App mobile em React Native (Expo) + backend FastAPI + Supabase + OpenAI `gpt-4o-mini`.

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

## Stack

| Camada     | Tecnologia                                      |
|------------|-------------------------------------------------|
| Frontend   | React Native + TypeScript + Expo SDK 54         |
| Backend    | FastAPI + Python 3.12 + Uvicorn                 |
| Banco      | Supabase (PostgreSQL + RLS)                     |
| IA         | OpenAI `gpt-4o-mini` via API                    |
| Auth       | JWT (python-jose + bcrypt) + HTTPOnly cookie    |
| Deploy     | Railway (backend) + Expo Go / EAS (frontend)    |
| Testes     | pytest + pytest-asyncio + httpx (86 testes)     |

---

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- [Node.js](https://nodejs.org/) v20.19+ (obrigatório — Expo 54 exige)
- [Git](https://git-scm.com/)
- Conta na [Expo](https://expo.dev) (só para `make apk`)

---

## Setup rápido (primeira vez)

### Windows

```powershell
# Abra o PowerShell como Administrador na raiz do projeto
.\setup.ps1
```

### Linux / macOS

```bash
chmod +x setup.sh && ./setup.sh
```

Ambos instalam: `make`, dependências do frontend (`npm install`) e `eas-cli`.

Depois **feche e reabra o terminal**.

---

## Variáveis de ambiente

### Backend — `backend/.env`

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=sua_chave_anon_supabase
SECRET_KEY=chave_aleatoria_minimo_32_chars
ENVIRONMENT=development
OPENAI_API_KEY=sk-proj-...
ADMIN_KEY=chave_para_endpoints_admin       # opcional
SENTRY_DSN=https://...                     # opcional
```

### Frontend — `frontend/.env`

```env
# Local (Docker)
API_URL=http://localhost:8000

# Produção (Railway)
API_URL=https://shello-production.up.railway.app
```

> `.env` nunca é commitado. Apenas `.env.example` vai no repositório.

---

## Comandos

| Comando        | O que faz                                              |
|----------------|--------------------------------------------------------|
| `make dev`     | Inicia o Expo em modo tunnel (QR code para Expo Go)    |
| `make apk`     | Gera APK Android via EAS Build (link para download)    |
| `make backend` | Sobe só o backend via Docker em `localhost:8000`       |
| `make down`    | Derruba os containers Docker                           |
| `make check`   | Valida tipos TypeScript do frontend                    |

### Rodar localmente (frontend + backend)

```bash
# Terminal 1 — backend
make backend

# Terminal 2 — frontend
make dev
```

Escaneia o QR com **Expo Go**:
- Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- iOS: câmera do iPhone ou App Store

### Gerar APK Android

```bash
# Primeira vez — autentica na Expo
eas login

# Gera o APK (build na nuvem, ~5 min)
make apk
```

Perfil `preview` → `.apk` instalável direto no Android.

---

## Endpoints principais

Base URL local: `http://localhost:8000`
Base URL produção: `https://shello-production.up.railway.app`

| Método | Endpoint                    | Descrição                               |
|--------|-----------------------------|-----------------------------------------|
| GET    | `/health`                   | Status da API                           |
| POST   | `/api/v1/auth/register`     | Cadastro de usuário                     |
| POST   | `/api/v1/auth/login`        | Login → seta cookie JWT HTTPOnly        |
| POST   | `/api/v1/auth/logout`       | Logout                                  |
| POST   | `/api/v1/onboarding/complete` | Salva respostas do onboarding         |
| POST   | `/api/chat`                 | Enviar mensagem ao agente Shello        |
| POST   | `/api/diary`                | Criar anotação no diário               |
| GET    | `/api/diary`                | Listar anotações (paginado)             |
| GET    | `/api/diary/search?q=`      | Buscar anotações                        |
| POST   | `/api/tasks/from-chat`      | Criar tarefa confirmada via chat        |
| PUT    | `/api/users/preferences`    | Atualizar formalidade / nome / tema     |
| PUT    | `/api/users/password`       | Alterar senha                           |
| GET    | `/api/history`              | Histórico unificado (chat + diário)     |
| GET    | `/api/v1/context`           | Fragmentos de contexto do agente        |
| GET    | `/admin/rls-check`          | Validar RLS (requer `ADMIN_KEY`)        |
| GET    | `/docs`                     | Swagger UI completo                     |

Autenticação: `Authorization: Bearer <token>` em todos exceto `/health` e `/auth/*`.

---

## Estrutura do projeto

```
shello/
├── backend/
│   ├── app/
│   │   ├── api/v1/            # rotas auth, onboarding, context (cookie-based)
│   │   ├── controllers/       # rotas chat, diary, tasks, history, users (Bearer)
│   │   ├── models/            # schemas Pydantic de request/response
│   │   ├── services/          # lógica de negócio (sem acesso direto ao banco)
│   │   ├── repositories/      # queries ao Supabase
│   │   └── core/
│   │       ├── config.py      # settings (pydantic-settings)
│   │       ├── security.py    # JWT + bcrypt
│   │       ├── dependencies.py# injeção de dependências
│   │       ├── mode_detector.py # detecta modo PRATICO vs PADRAO
│   │       ├── prompt_builder.py# monta prompt de 6 blocos
│   │       ├── scheduler.py   # arquiva conversas inativas (APScheduler)
│   │       └── llm/
│   │           ├── base.py          # interface abstrata LLMProvider
│   │           ├── openai_provider.py # gpt-4o-mini, temp 0.7
│   │           └── exceptions.py
│   ├── tests/                 # 86 testes (pytest + pytest-asyncio)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── screens/           # TelaAutenticacao, TelaChat, TelaDiario,
│   │   │                      # TelaEntradaDiario, TelaTarefas, TelaPerfil,
│   │   │                      # TelaOnboarding, HomeScreen
│   │   ├── navigation/        # React Navigation (bottom tabs + stacks)
│   │   ├── services/          # api.ts (axios, baseURL via API_URL)
│   │   ├── contexts/          # ShelloContext (estado global)
│   │   ├── styles/            # tema.ts (light/dark)
│   │   └── types/             # tipos TypeScript globais
│   ├── assets/                # logoshello.jpeg, shello-expressoes.jpeg
│   ├── app.json               # config Expo
│   ├── eas.json               # perfis de build EAS
│   └── .env                   # API_URL (não commitado)
├── docker-compose.yml
├── Makefile
├── setup.ps1                  # setup automático Windows
├── setup.sh                   # setup automático Linux/macOS
└── README.md
```

---

## Arquitetura do backend

```
Controller → Service → Repository → Supabase
```

- **Controller** — só roteia, zero lógica
- **Service** — lógica de negócio pura, testável sem banco
- **Repository** — queries ao Supabase, mockado nos testes
- **LLMProvider** — interface abstrata; troca de modelo em 1 arquivo

---

## Testes

```bash
# Dentro do container ou com venv ativo
cd backend
pytest --tb=short -v
```

86 testes cobrindo todos os 9 módulos (RLS, diário, LLM, chat, extração, custo, histórico, tasks, configurações).

---

## Deploy (produção)

Backend hospedado no **Railway** com deploy automático ao push na `main`.

Para redeploy manual: push qualquer commit na `main` ou clica **Redeploy** no painel do Railway.

Variáveis configuradas no painel Railway (nunca no repositório):
`SUPABASE_URL`, `SUPABASE_KEY`, `SECRET_KEY`, `ENVIRONMENT=production`, `OPENAI_API_KEY`

---

## Padrões de desenvolvimento

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **TDD:** Red → Green → Refactor — sem código de produção sem teste falhando primeiro
- **Branches:** `feature/`, `fix/`, `chore/` → PR para `main`
- **Segredos:** `.env` nunca commitado; chaves só no Railway Variables ou local
