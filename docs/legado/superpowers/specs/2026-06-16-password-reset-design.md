# Password Reset — Design Spec
**Data:** 2026-06-16  
**Status:** Aprovado

---

## Contexto

Backend já tem endpoints e lógica de token implementados:
- `POST /api/v1/auth/password-reset/request` — gera token seguro, salva SHA-256 em `password_reset_tokens`, retorna token em dev
- `POST /api/v1/auth/password-reset/confirm` — valida hash, atualiza senha, invalida token

Faltava: envio de email e interface para o usuário inserir a nova senha.

---

## Decisões de design

| Decisão | Escolha | Razão |
|---------|---------|-------|
| Provedor de email | Resend | Free tier 3.000/mês, API simples |
| From address | `onboarding@resend.dev` | Sem domínio próprio por ora; trocar quando domínio for adquirido |
| Interface de reset | Página web no Railway | Sem UI extra no app; evolui para deep link depois |
| Token na URL | Query param `?token=xxx` | Token hex de 64 chars, usado diretamente no confirm |

---

## Arquitetura

### Backend

#### 1. `backend/app/services/email_service.py` (novo)

Responsabilidade única: enviar emails via Resend.

```
EmailService
  └── send_reset_email(to_email: str, reset_url: str) -> None
```

- Usa `resend` Python SDK
- Lança `RuntimeError` se envio falhar (propagado como HTTP 500)
- `RESEND_API_KEY` vem de `settings`

#### 2. `backend/app/core/config.py` (atualização)

Adicionar campo:
```python
resend_api_key: str = ""
```

#### 3. `backend/app/services/auth_service.py` (atualização)

`request_password_reset()` passa a:
1. Gerar token e salvar hash (já feito)
2. Montar URL: `{BASE_URL}/reset-password?token={raw_token}`
3. Chamar `EmailService.send_reset_email(user.email, url)`
4. Continuar retornando `raw_token` em dev (para testes sem email)

`BASE_URL` vem de `settings.base_url` (nova variável de ambiente).

#### 4. `GET /reset-password` (novo endpoint em `auth.py`)

Retorna `HTMLResponse` com:
- Campo "Nova senha" + "Confirmar senha"
- Token embutido em campo hidden (pego do query param)
- Submit faz `POST /api/v1/auth/password-reset/confirm` via fetch JS
- Página de sucesso: "Senha redefinida com sucesso. Abra o Shello e faça login."
- Página de erro: "Link inválido ou expirado. Solicite um novo no app."
- Visual simples, consistente com paleta do Shello (verde `#5E836A`, fundo `#F5F0EB`)

### Frontend

**Nenhuma mudança necessária.** A tela "recuperar" já exibe:
> "Se o e-mail estiver cadastrado, você receberá um link em breve."

---

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `RESEND_API_KEY` | Chave da API Resend | `re_xxxxx` |
| `BASE_URL` | URL base do backend em produção | `https://shello-production.up.railway.app` |

Adicionar em `.env.example` (sem valores). Configurar no painel Railway Variables.

---

## Fluxo completo

```
1. Usuário no app → preenche email → POST /request
2. Backend: gera token → salva hash → EmailService.send_reset_email()
3. Resend envia email: "Clique aqui para redefinir sua senha" → link com token
4. Usuário abre email → clica link → GET /reset-password?token=xxx
5. Railway serve página HTML → usuário preenche nova senha
6. Página faz POST /confirm com token + nova senha
7. Backend: valida hash → atualiza senha → invalida token
8. Página mostra: "Senha redefinida. Abra o Shello e faça login."
```

---

## Tratamento de erros

| Cenário | Comportamento |
|---------|--------------|
| Email não cadastrado | Resposta genérica (não revela cadastro) — já implementado |
| Resend falha | HTTP 500 no request; usuário vê "Ocorreu um erro" |
| Token expirado (1h) | Página mostra "Link inválido ou expirado" |
| Token já usado | Idem — `used=True` no banco |
| Nova senha fraca | Validação Pydantic no confirm → página mostra erro |

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `backend/app/services/email_service.py` | Criar |
| `backend/app/core/config.py` | Adicionar `resend_api_key`, `base_url` |
| `backend/app/services/auth_service.py` | Chamar EmailService no request |
| `backend/app/api/v1/auth.py` | Adicionar `GET /reset-password` |
| `backend/requirements.txt` | Adicionar `resend` |
| `backend/.env.example` | Adicionar `RESEND_API_KEY`, `BASE_URL` |

---

## Fora de escopo (evoluir depois)

- Deep link (`shello://`) abrindo app direto na tela de reset
- Domínio próprio no Resend (`noreply@shello.app`)
- Template HTML de email com identidade visual completa
