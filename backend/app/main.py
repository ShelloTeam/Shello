from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
from app.api.v1.tasks import router as tasks_v1_router

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
app.include_router(tasks_v1_router)

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