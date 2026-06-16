from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager
from supabase import create_client
from app.core.scheduler import ConversationScheduler
from app.repositories.chat_repository import ChatRepository
from app.core.config import settings
from app.core.rls_validator import RLSValidator
from app.controllers.diary_controller import router as diary_router
from app.controllers.chat_controller import router as chat_router
from app.controllers.history_controller import router as history_router
from app.controllers.tasks_controller import router as tasks_router
from app.controllers.user_controller import router as user_router
from app.controllers.routines_controller import router as routines_router
from app.controllers.memories_controller import router as memories_router
from app.controllers.onboarding_controller import router as onboarding_mobile_router
from app.api.v1.auth import router as auth_router
from app.api.v1.onboarding import router as onboarding_router
from app.api.v1.context_fragments import router as context_router

tags_metadata = [
    {"name": "Health",        "description": "Verificação de saúde da API"},
    {"name": "Auth",          "description": "Autenticação e onboarding"},
    {"name": "Diário",        "description": "CRUD de anotações pessoais"},
    {"name": "Tarefas",       "description": "Gestão de tarefas (ToDo)"},
    {"name": "Rotinas",       "description": "Rotinas diárias (manhã/tarde/noite)"},
    {"name": "Memórias IA",   "description": "Memórias persistentes do agente Shello"},
    {"name": "Chat",          "description": "Conversas com o agente Shello"},
    {"name": "Contexto",      "description": "Fragmentos de contexto do agente"},
    {"name": "Configurações", "description": "Preferências de conta e do agente"},
    {"name": "Histórico",     "description": "Histórico unificado de conversas e anotações"},
    {"name": "Admin",         "description": "Endpoints administrativos (requerem ADMIN_KEY)"},
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = None
    if settings.supabase_url and settings.supabase_key:
        db = create_client(settings.supabase_url, settings.supabase_key)
        chat_repo = ChatRepository(db=db)
        scheduler = ConversationScheduler(chat_repository=chat_repo)
        scheduler.start()
    yield
    if scheduler:
        scheduler.stop()

app = FastAPI(
    title="Shello API",
    lifespan=lifespan,
    description="""
## API do Shello — Assistente Pessoal Inteligente

### Autenticação Todos os endpoints (exceto `/health` e `/auth/*`) requerem JWT no header:
### Códigos de status padrão
| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 201 | Recurso criado |
| 400 | Erro de negócio |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 422 | Dados inválidos |
| 503 | Serviço externo indisponível |
""",
    version="1.0.0",
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diary_router)
app.include_router(chat_router)
app.include_router(history_router)
app.include_router(tasks_router)
app.include_router(user_router)
app.include_router(routines_router)
app.include_router(memories_router)
app.include_router(onboarding_mobile_router)
app.include_router(auth_router)
app.include_router(onboarding_router)
app.include_router(context_router)

_RESET_PAGE_HTML = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir senha — Shello</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: -apple-system, sans-serif; background: #F5F0EB; min-height: 100vh;
           display: flex; align-items: center; justify-content: center; padding: 16px; }}
    .card {{ background: #fff; border-radius: 20px; padding: 36px 28px; max-width: 420px;
             width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
    h1 {{ color: #3D5A47; font-size: 22px; margin-bottom: 8px; }}
    p {{ color: #888; font-size: 14px; margin-bottom: 24px; }}
    label {{ font-size: 14px; color: #555; display: block; margin-bottom: 6px; }}
    input {{ width: 100%; border: 1.5px solid #D6E2D8; border-radius: 12px; padding: 13px 16px;
             font-size: 15px; outline: none; margin-bottom: 16px; }}
    input:focus {{ border-color: #5E836A; }}
    button {{ width: 100%; background: #5E836A; color: #fff; border: none; border-radius: 24px;
              padding: 15px; font-size: 16px; font-weight: 600; cursor: pointer; }}
    button:hover {{ background: #4a6b55; }}
    .msg {{ margin-top: 16px; padding: 12px 16px; border-radius: 10px; font-size: 14px; display: none; }}
    .msg.erro {{ background: #FDE8E8; color: #B00020; }}
    .msg.ok {{ background: #D6E2D8; color: #3D5A47; }}
    .logo {{ font-size: 28px; margin-bottom: 12px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🐢</div>
    <h1>Nova senha</h1>
    <p>Digite e confirme sua nova senha abaixo.</p>
    <form id="form">
      <label>Nova senha</label>
      <input type="password" id="senha" placeholder="Mínimo 8 caracteres" required>
      <label>Confirmar senha</label>
      <input type="password" id="confirmar" placeholder="Repita a senha" required>
      <button type="submit">Redefinir senha</button>
    </form>
    <div class="msg erro" id="erro"></div>
    <div class="msg ok" id="ok"></div>
  </div>
  <script>
    const token = "{token}";
    document.getElementById("form").addEventListener("submit", async function(e) {{
      e.preventDefault();
      const senha = document.getElementById("senha").value;
      const confirmar = document.getElementById("confirmar").value;
      const erroEl = document.getElementById("erro");
      const okEl = document.getElementById("ok");
      erroEl.style.display = "none";
      okEl.style.display = "none";
      if (senha !== confirmar) {{
        erroEl.textContent = "As senhas não coincidem.";
        erroEl.style.display = "block";
        return;
      }}
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&_\\-#])[A-Za-z\\d@$!%*?&_\\-#]{{8,}}$/.test(senha)) {{
        erroEl.textContent = "Senha deve ter 8+ caracteres, maiúscula, minúscula, número e símbolo (@$!%*?&_-#).";
        erroEl.style.display = "block";
        return;
      }}
      try {{
        const res = await fetch("/api/v1/auth/password-reset/confirm", {{
          method: "POST",
          headers: {{"Content-Type": "application/json"}},
          body: JSON.stringify({{token: token, new_password: senha}})
        }});
        if (res.ok) {{
          document.getElementById("form").style.display = "none";
          okEl.textContent = "Senha redefinida com sucesso! Abra o Shello e faça login.";
          okEl.style.display = "block";
        }} else {{
          const data = await res.json();
          erroEl.textContent = data.detail || "Link inválido ou expirado. Solicite um novo no app.";
          erroEl.style.display = "block";
        }}
      }} catch (_) {{
        erroEl.textContent = "Erro de conexão. Tente novamente.";
        erroEl.style.display = "block";
      }}
    }});
  </script>
</body>
</html>"""

_RESET_INVALID_HTML = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Link inválido — Shello</title>
  <style>
    body {{ font-family: -apple-system, sans-serif; background: #F5F0EB; min-height: 100vh;
           display: flex; align-items: center; justify-content: center; padding: 16px; }}
    .card {{ background: #fff; border-radius: 20px; padding: 36px 28px; max-width: 420px;
             width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
    h1 {{ color: #B00020; font-size: 20px; margin: 12px 0 8px; }}
    p {{ color: #888; font-size: 14px; }}
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:36px">⚠️</div>
    <h1>Link inválido ou expirado</h1>
    <p>Solicite um novo link de recuperação no app Shello.</p>
  </div>
</body>
</html>"""


@app.get("/reset-password", response_class=HTMLResponse, include_in_schema=False)
async def reset_password_page(token: str = ""):
    if not token:
        return HTMLResponse(content=_RESET_INVALID_HTML, status_code=200)
    return HTMLResponse(content=_RESET_PAGE_HTML.format(token=token), status_code=200)


@app.get("/health", tags=["Health"], summary="Verificação de saúde")
async def health():
    return {"status": "ok"}

@app.get(
    "/admin/rls-check",
    tags=["Admin"],
    summary="Validar RLS de todas as tabelas",
    description="Verifica se Row Level Security está ativo nas 7 tabelas. Requer ADMIN_KEY no header.",
    responses={
        403: {"description": "ADMIN_KEY ausente ou inválida"},
    },
)
async def rls_check(x_admin_key: str | None = Header(default=None)):
    if not x_admin_key or x_admin_key != settings.admin_key:
        raise HTTPException(status_code=403, detail="ADMIN_KEY inválida")
    from supabase import create_client
    db = create_client(settings.supabase_url, settings.supabase_key)
    validator = RLSValidator(db=db)
    return await validator.validate_all()