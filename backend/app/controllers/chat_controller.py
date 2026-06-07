from fastapi import APIRouter, Depends, HTTPException
from app.models.chat_models import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.repositories.chat_repository import ChatRepository
from app.repositories.context_repository import ContextRepository
from app.repositories.user_repository import UserRepository
from app.core.dependencies import get_current_user, get_supabase, User
from app.core.llm.exceptions import LLMProviderError
from app.core.config import settings

router = APIRouter(prefix="/api/chat", tags=["Chat"])


def get_chat_service(db=Depends(get_supabase)) -> ChatService:
    from app.core.llm.openai_provider import OpenAIProvider
    chat_repo = ChatRepository(db=db)
    context_repo = ContextRepository(db=db)
    llm = OpenAIProvider(api_key=settings.openai_api_key)
    return ChatService(
        chat_repository=chat_repo,
        llm_provider=llm,
        context_repository=context_repo,
    )


def get_user_repo() -> UserRepository:
    return UserRepository()


@router.post(
    "",
    response_model=ChatResponse,
    summary="Enviar mensagem ao agente Shello",
    description="""
Processa a mensagem do usuário e retorna a resposta do agente.

**Fluxo:**
1. Busca ou cria conversa ativa
2. Verifica limite de 20 mensagens
3. Detecta modo (PRATICO/PADRAO)
4. Gera resposta via LLM
5. Modera a resposta
6. Persiste apenas se aprovada

**Autenticação:** Bearer token JWT obrigatório
""",
    responses={
        400: {"description": "Limite de 20 mensagens por conversa atingido"},
        401: {"description": "Token JWT ausente ou inválido"},
        503: {"description": "LLM indisponível"},
    },
)
async def send_message(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
    user_repo: UserRepository = Depends(get_user_repo),
):
    try:
        prefs = await user_repo.get_preferences(current_user.id)
        user_name = prefs.nome_referencia or "usuário"
        formalidade = prefs.formalidade or "media"

        return await service.send(
            user_id=current_user.id,
            message=body.message,
            conversation_id=body.conversation_id,
            user_name=user_name,
            formalidade=formalidade,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LLMProviderError as e:
        raise HTTPException(status_code=503, detail=str(e))
