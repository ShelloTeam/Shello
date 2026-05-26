# Shello

Aplicativo mobile com React Native (Expo) + FastAPI + Supabase. Chat, diário pessoal e gestão de tarefas em um único lugar.

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- [Node.js](https://nodejs.org/) v20+
- [Git](https://git-scm.com/)
- Conta na [Expo](https://expo.dev) (necessário apenas para `make apk`)

---

## Setup (primeira vez)

Abra o PowerShell **como Administrador** na raiz do projeto e rode:

```powershell
.\setup.ps1
```

Isso instala automaticamente:
- `make` para Windows
- Dependências do frontend (`npm install`)
- `eas-cli` para geração de APK
- Cria `backend/.env` a partir do `.env.`

Depois, **feche e reabra o terminal**.

### Configurar o backend/.env

Preencha as variáveis em `backend/.env`:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=sua_chave_supabase
SECRET_KEY=uma_chave_secreta_longa
ENVIRONMENT=development
```

---

## Comandos

| Comando        | O que faz                                                    |
|----------------|--------------------------------------------------------------|
| `make dev`     | Sobe o backend e inicia o Expo em modo tunnel (QR code)      |
| `make apk`     | Sobe o backend e gera APK Android via EAS Build (link final) |
| `make backend` | Sobe só o backend via Docker                                 |
| `make down`    | Derruba os containers Docker                                 |

### `make dev` — Rodar localmente

```bash
make dev
```

Escaneie o QR code com o **Expo Go** no celular:
- Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- iOS: câmera do iPhone

### `make apk` — Gerar APK Android

```bash
make apk
```

> **Na primeira vez**, rode antes:
> ```bash
> eas login
> ```
> O build roda na nuvem da Expo. Ao terminar, gera um link para baixar o `.apk` direto no celular.
>
> Perfil `preview` → `.apk` (instalável direto)
> Perfil `production` → `.aab` (para Play Store)

---

## Estrutura

```
shello/
├── backend/               # FastAPI + Python 3.12 (padrão MVC)
│   ├── app/
│   │   ├── controllers/   # rotas por módulo
│   │   ├── models/        # schemas Pydantic
│   │   ├── services/      # lógica de negócio
│   │   ├── repositories/  # queries ao Supabase
│   │   ├── core/          # config e segurança (JWT)
│   │   └── main.py
│   └── Dockerfile
├── frontend/              # React Native + TypeScript + Expo
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/    # React Navigation (bottom tabs)
│   │   ├── services/      # chamadas à API (axios)
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   └── App.tsx
├── docker-compose.yml
├── Makefile
├── setup.ps1              # setup automático para Windows
└── README.md
```

---

## Padrões

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Branches:** `feature/`, `fix/`, `chore/`
- **Env:** `.env` nunca commitado — apenas `.env.` com chaves sem valores
