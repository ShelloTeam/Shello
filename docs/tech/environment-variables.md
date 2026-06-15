# Variáveis de Ambiente — Shello

> Documentação completa de todas as variáveis de ambiente necessárias para rodar o projeto.
> **NUNCA** commite arquivos `.env` no repositório. Use `.env.example` como referência.

---

## Backend (`backend/.env`)

### Variáveis Obrigatórias

| Variável | Obrigatória | Descrição | Exemplo de valor |
|---|---|---|---|
| `SUPABASE_URL` | ✅ Sim | URL da instância Supabase do projeto | `https://xyzabc.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ Sim | Chave pública do Supabase (segura para requests autenticados via RLS) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_KEY` | ✅ Sim | Chave de serviço do Supabase (bypassa RLS — usar apenas no backend) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `OPENAI_API_KEY` | ✅ Sim | Chave da API da OpenAI | `sk-proj-...` |
| `JWT_SECRET_KEY` | ✅ Sim | Secret para assinar JWTs internos (min 32 chars, alta entropia) | `super-secret-key-with-32-or-more-chars` |
| `JWT_ALGORITHM` | ✅ Sim | Algoritmo de assinatura do JWT | `HS256` |

### Variáveis de Configuração

| Variável | Obrigatória | Descrição | Padrão | Exemplo |
|---|---|---|---|---|
| `JWT_EXPIRATION_DAYS` | ⚠️ Recomendada | Dias até expirar o JWT | `7` | `7` |
| `ENVIRONMENT` | ⚠️ Recomendada | Ambiente de execução | `development` | `production` |
| `LOG_LEVEL` | ❌ Opcional | Nível de log do Uvicorn/FastAPI | `INFO` | `DEBUG` |
| `ALLOWED_ORIGINS` | ⚠️ Recomendada | CORS origins permitidas (vírgula separada) | `*` em dev | `https://app.shello.com` |
| `COST_ALERT_THRESHOLD_USD` | ❌ Opcional | Limite de custo diário por usuário em USD para alerta | `0.50` | `0.50` |

### Variáveis de Monitoramento

| Variável | Obrigatória | Descrição | Exemplo |
|---|---|---|---|
| `SENTRY_DSN` | ⚠️ Recomendada em prod | DSN do Sentry para error tracking do backend | `https://abc@o123.ingest.sentry.io/456` |

---

## Frontend (`frontend/.env` ou `app.config.js`)

> No Expo, variáveis de ambiente são expostas via `app.config.js` ou pelo prefixo `EXPO_PUBLIC_` em `.env`.
> **Nunca coloque secrets no frontend** — tudo que vai para o app mobile é visível ao usuário.

| Variável | Obrigatória | Descrição | Exemplo |
|---|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | ✅ Sim | URL base do backend FastAPI | `https://shello-api.up.railway.app` |
| `EXPO_PUBLIC_SENTRY_DSN` | ⚠️ Recomendada em prod | DSN do Sentry para o frontend (público, sem problema) | `https://xyz@o789.ingest.sentry.io/012` |

---

## Onde Configurar

### Desenvolvimento Local

1. Copie o arquivo de exemplo:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Preencha os valores reais no `backend/.env`.
3. O arquivo `.env` está no `.gitignore` e **nunca** deve ser commitado.

### Produção (Railway)

1. Acesse o dashboard do Railway → seu projeto → **Variables**.
2. Adicione cada variável individualmente.
3. **Não use** arquivos `.env` em produção — apenas as Railway Variables.
4. O Railway injeta as variáveis automaticamente no container durante o build e runtime.

---

## `.env.example` — Referência para Novos Devs

O arquivo `backend/.env.example` deve sempre estar atualizado no repositório. Exemplo de conteúdo:

```dotenv
# backend/.env.example
# Copie este arquivo para backend/.env e preencha os valores reais.
# NUNCA commite o arquivo .env!

# --- Supabase ---
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# --- OpenAI ---
OPENAI_API_KEY=sk-proj-your-openai-api-key

# --- JWT ---
JWT_SECRET_KEY=your-very-long-and-random-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7

# --- App ---
ENVIRONMENT=development
LOG_LEVEL=DEBUG
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081

# --- Monitoramento ---
SENTRY_DSN=

# --- Cost Tracking ---
COST_ALERT_THRESHOLD_USD=0.50
```

---

## Segurança: Regras Críticas

> ⚠️ Estas regras não são opcionais.

1. **`OPENAI_API_KEY` nunca deve aparecer em logs, responses ou error messages.**
   Configure mascaramento no Sentry (`send_default_pii=False`) e no logger.

2. **`SUPABASE_SERVICE_KEY` bypassa RLS** — deve ser usada apenas no backend, nunca exposta ao frontend ou logada.

3. **`JWT_SECRET_KEY` deve ter alta entropia** (mínimo 32 chars aleatórios). Gere com:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

4. **Em caso de vazamento de qualquer secret**, rotacione imediatamente nas Railway Variables e no Supabase Dashboard.
