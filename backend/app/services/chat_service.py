from __future__ import annotations
from app.models.chat_models import Conversation, ChatResponse
from app.repositories.chat_repository import ChatRepository
from app.core.llm.base import LLMProvider
from app.core.llm.exceptions import LLMProviderError
from app.core.mode_detector import detect_mode
from app.core.prompt_builder import PromptBuilder

MESSAGE_LIMIT = 20


class ChatService:
    """
    Lógica de negócio do chat com o agente Shello.

    Orquestra o fluxo completo:
    1. Validação de limite de mensagens (máx 20 por conversa)
    2. Busca de fragmentos de contexto ativos
    3. Detecção de modo (PRATICO/PADRAO)
    4. Montagem do prompt de 6 blocos via PromptBuilder
    5. Chamada ao LLM via LLMProvider
    6. Moderação da resposta
    7. Persistência apenas se aprovada

    Raises:
        ValueError: Quando message_count >= 20.
        LLMProviderError: Propagado quando LLM está indisponível (→ HTTP 503).
    """

    def __init__(
        self,
        chat_repository: ChatRepository,
        llm_provider: LLMProvider,
        context_repository,
        cost_tracker=None,
    ):
        self.chat_repository = chat_repository
        self.llm_provider = llm_provider
        self.context_repository = context_repository
        self.cost_tracker = cost_tracker
        self._prompt_builder = PromptBuilder()

    async def send(
        self,
        user_id: str,
        message: str,
        conversation_id: str | None = None,
        user_name: str = "usuário",
        formalidade: str = "media",
    ) -> ChatResponse:
        """
        Processa mensagem e retorna resposta do agente.

        Args:
            user_id: UUID do usuário autenticado.
            message: Texto da mensagem (máx 2.000 chars).
            conversation_id: UUID da conversa a continuar. None = busca/cria.
            user_name: Nome de referência para o prompt.
            formalidade: Nível de formalidade para o prompt.

        Returns:
            ChatResponse com response, mode, blocked, conversation_id, message_count.

        Raises:
            ValueError: Se message_count >= 20 na conversa ativa.
            LLMProviderError: Se LLM indisponível.
        """
        conversation = await self._get_or_create_conversation(user_id)

        if conversation.message_count >= MESSAGE_LIMIT:
            raise ValueError(f"Limite de {MESSAGE_LIMIT} mensagens atingido. Inicie uma nova conversa.")

        fragments = await self.context_repository.get_active_fragments(user_id)
        history = await self.chat_repository.get_history(conversation.id)
        mode = detect_mode(message)
        system_prompt = self._prompt_builder.build(
            user_name=user_name,
            formalidade=formalidade,
            fragments=fragments,
            history=history,
            mode=mode,
            message=message,
        )

        llm_response = await self.llm_provider.generate(
            system_prompt=system_prompt,
            history=history,
            user_message=message,
        )

        is_safe = await self.llm_provider.moderate(llm_response)

        if not is_safe:
            return ChatResponse(
                response="Resposta bloqueada pela moderação.",
                mode=mode,
                blocked=True,
                conversation_id=conversation.id,
                message_count=conversation.message_count,
            )

        await self.chat_repository.save_message(conversation.id, "user", message)
        await self.chat_repository.save_message(conversation.id, "assistant", llm_response)
        await self.chat_repository.increment_message_count(conversation.id)

        return ChatResponse(
            response=llm_response,
            mode=mode,
            blocked=False,
            conversation_id=conversation.id,
            message_count=conversation.message_count + 2,
        )

    async def _get_or_create_conversation(self, user_id: str) -> Conversation:
        conv = await self.chat_repository.get_active_conversation(user_id)
        if conv is None:
            conv = await self.chat_repository.create_conversation(user_id)
        return conv
