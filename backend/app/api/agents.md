# agents.md — API (v1)

> **Módulo:** `backend/app/api/v1/`
> **Papel:** Rotas de autenticação e onboarding com **cookie HTTPOnly**. Diferente dos controllers/, que usam Bearer token.

---

## Diferença entre `api/v1/` e `controllers/`

| Aspecto | `api/v1/` | `controllers/` |
|---|---|---|
| **Autenticação** | Cookie HTTPOnly (`access_token`) | Header `Authorization: Bearer <token>` |
| **Usuário típico** | Browser (web) | Mobile app / SPA com token manual |
| **Fluxo de auth** | Cookie → redireciona → onboarding | Bearer token em cada request |
| **Dependência** | `app.dependencies.auth.get_current_user` (lê cookie) | `app.core.dependencies.get_current_user` (lê header) |
| **Retorno típico** | `RedirectResponse` (303) ou `JSONResponse` | `response_model` Pydantic direto |
| **Endpoints mobile** | `/mobile/login`, `/mobile/register` (retornam JSON) | — |

> **Atenção:** São dois `get_current_user` diferentes. Importe sempre do módulo correto.
> - Cookie: `from app.dependencies.auth import get_current_user` → retorna `TokenData`
> - Bearer: `from app.core.dependencies import get_current_user` → retorna `User`

---

## Arquivos em `api/v1/`

| Arquivo | Prefixo | Tag Swagger | Descrição |
|---|---|---|---|
| `auth.py` | `/api/v1/auth` | `auth` | Registro, login, logout, reset de senha |
| `onboarding.py` | `/api/v1/onboarding` | `onboarding` | Status e conclusão do onboarding |
| `tasks.py` | `/api/v1/tasks` (?) | — | Tasks via API v1 (se existir) |
| `conversations.py` | `/api/v1/conversations` (?) | — | Conversas via API v1 (se existir) |
| `context_fragments.py` | `/api/v1/context-fragments` | — | Fragments via API v1 (se existir) |

---

## Fluxo de autenticação completo

```
1. POST /api/v1/auth/register
   └─ Body: { email, password, nome }
   └─ Chama AuthService.register_user()
   └─ Define cookie HTTPOnly access_token (7 dias)
   └─ Redireciona 303 → /onboarding

2. POST /api/v1/auth/login
   └─ Body: { email, password }
   └─ Chama AuthService.login_user()
   └─ Define cookie HTTPOnly access_token (7 dias)
   └─ Redireciona 303 → /dashboard

3. GET /api/v1/onboarding/status
   └─ Requer cookie access_token
   └─ Retorna { completed: bool, answers: {...} }

4. POST /api/v1/onboarding/complete
   └─ Body: { q1_name, q2_lifestyle, q3_goal }
   └─ Requer cookie access_token
   └─ Status 201 se criado, 409 se já concluído

5. [Usuário usa o app com cookie presente no browser]

6. POST /api/v1/auth/logout
   └─ Deleta cookie access_token
   └─ Retorna { message: "Logout realizado." }
```

---

## Endpoints de `auth.py`

### Web (cookie-based)

| Método | Path | Status | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | 303 | Cadastra e redireciona para `/onboarding` |
| `POST` | `/api/v1/auth/login` | 303 | Autentica e redireciona para `/dashboard` |
| `POST` | `/api/v1/auth/logout` | 200 | Apaga cookie e retorna JSON |
| `POST` | `/api/v1/auth/password-reset/request` | 200 | Envia link de reset (resposta sempre genérica) |
| `POST` | `/api/v1/auth/password-reset/confirm` | 200 | Confirma reset com token + nova senha |

### Mobile (JSON-based)

| Método | Path | Status | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/auth/mobile/login` | 200 | Retorna `{ token, nome, user_id }` |
| `POST` | `/api/v1/auth/mobile/register` | 201 | Retorna `{ token, nome, user_id }` |

---

## Endpoints de `onboarding.py`

| Método | Path | Status | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/onboarding/status` | 200 | Retorna estado atual do onboarding |
| `POST` | `/api/v1/onboarding/complete` | 201 | Envia 3 respostas e conclui o onboarding |

**Respostas do `complete`:**
- `201 Created` — sucesso
- `409 Conflict` — onboarding já concluído anteriormente
- `404 Not Found` — usuário sem registro de onboarding
- `401 Unauthorized` — cookie ausente ou inválido

---

## Como funciona o cookie HTTPOnly

```python
# Definição do cookie (em auth.py)
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,                      # JavaScript não acessa
    secure=settings.is_production,      # HTTPS obrigatório em produção
    samesite="lax",                     # proteção CSRF moderada
    max_age=60 * 60 * 24 * 7,          # 7 dias
    path="/",
)

# Remoção (logout)
response.delete_cookie(key="access_token", path="/", httponly=True, samesite="lax")
```

**Segurança:**
- `httponly=True` — protege contra XSS (JS malicioso não consegue ler o token)
- `secure=True` em produção — transmitido apenas via HTTPS
- `samesite="lax"` — permite links externos mas bloqueia CSRF em POSTs cross-site

---

## Reset de senha

**Etapa 1 — Solicitar reset:**
- Resposta sempre idêntica (`"Se o e-mail estiver cadastrado, você receberá um link em breve."`)
- **Nunca revela** se o e-mail está cadastrado (proteção contra enumeração)
- Em desenvolvimento (`is_production=False`), retorna `dev_token` no JSON para facilitar testes

**Etapa 2 — Confirmar reset:**
- Recebe `{ token, new_password }`
- Token invalidado após primeiro uso
- `ValueError` → HTTP 400 ("Token inválido ou expirado")

---

## Schemas usados (em `app/schemas/`)

```python
# app/schemas/auth.py
class UserCreate(BaseModel):
    email: str
    password: str
    nome: str

class UserLogin(BaseModel):
    email: str
    password: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class TokenData(BaseModel):
    sub: str    # user_id (UUID)

# app/schemas/onboarding.py
class OnboardingSubmit(BaseModel):
    q1_name: str
    q2_lifestyle: str
    q3_goal: str
```

---

## Como adicionar uma nova rota em `api/v1/`

1. Crie (ou edite) `backend/app/api/v1/<dominio>.py`
2. Use `router = APIRouter(prefix="/api/v1/<dominio>", tags=["<tag>"])`
3. Implemente a dependência de auth via cookie: `current_user: TokenData = Depends(get_current_user)` (do `app.dependencies.auth`)
4. Registre em `main.py`:
   ```python
   from app.api.v1.novo import router as novo_v1_router
   app.include_router(novo_v1_router)
   ```

---

## Anti-patterns — nunca faça isso

```python
# ❌ Misturar auth de cookie com Bearer no mesmo módulo
from app.core.dependencies import get_current_user   # ← errado para api/v1/
# Use: from app.dependencies.auth import get_current_user

# ❌ Expor dev_token em produção
if raw_token:
    response_body["dev_token"] = raw_token          # ← sempre verificar is_production primeiro

# ❌ Mensagem de erro revelando qual campo falhou no login
detail="Email não encontrado"                       # ← use sempre "Credenciais inválidas."

# ❌ Cookie sem httponly=True
response.set_cookie(key="access_token", value=token) # ← sem httponly — vulnerável a XSS
```
