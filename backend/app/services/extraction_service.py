from __future__ import annotations
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """Analise o texto e extraia fragmentos de contexto sobre o usuário.
Responda APENAS com JSON válido no formato:
{"fragmentos": [{"content": "fato em terceira pessoa, max 300 chars", "category": "categoria"}]}

Categorias válidas: preferencia, habito, objetivo, contexto, relacionamento
Não inclua conteúdo emocional ou subjetivo. Apenas fatos objetivos sobre o usuário.
Se não houver fragmentos relevantes, responda: {"fragmentos": []}"""


class ExtractionService:
    """
    Extração assíncrona de fragmentos de contexto de anotações do diário via LLM.

    Fragmentos são salvos com is_active=False (requerem aprovação manual).
    Erros de parsing do LLM são silenciados — nunca quebram o fluxo do diário.

    Attributes:
        llm_provider: LLMProvider para chamadas ao modelo.
        context_repo: ContextRepository para persistência de fragmentos.
        cost_tracker: CostTracker para monitoramento de custos.
    """

    def __init__(self, llm_provider: Any = None, context_repo: Any = None, cost_tracker: Any = None):
        self.llm_provider = llm_provider
        self.context_repo = context_repo
        self.cost_tracker = cost_tracker

    async def extract_from_diary(
        self, entry_id: str, content: str, user_id: str
    ) -> list[dict]:
        """
        Extrai fragmentos de contexto de uma anotação do diário.

        Chamada via asyncio.create_task() — não bloqueia o retorno do POST /api/diary.
        Fragmentos salvos com is_active=False.

        Args:
            entry_id: UUID da anotação de origem.
            content: Texto da anotação.
            user_id: UUID do usuário.

        Returns:
            Lista de dicts com {content, category}. Vazia se LLM retornar JSON inválido.
        """
        if not self.llm_provider:
            return []

        try:
            raw = await self.llm_provider.generate(
                system_prompt=EXTRACTION_PROMPT,
                history=[],
                user_message=content,
            )
        except Exception as exc:
            logger.warning("Extraction LLM failed for entry %s: %s", entry_id, exc)
            return []

        if self.cost_tracker:
            await self.cost_tracker.log_and_check(user_id, 0, 0, "extraction")

        fragments = self._parse_llm_response(raw)

        if self.context_repo and fragments:
            for fragment in fragments:
                await self.context_repo.save(
                    user_id=user_id,
                    content=fragment["content"],
                    category=fragment.get("category", "contexto"),
                    is_active=False,
                    derived_from_diary_id=entry_id,
                )

        return fragments

    def _parse_llm_response(self, raw: str) -> list[dict]:
        """
        Parses LLM JSON response. Returns empty list on any parsing error.
        Never raises exceptions — invalid LLM output is silenced.
        """
        try:
            data = json.loads(raw)
            return data.get("fragmentos", [])
        except (json.JSONDecodeError, AttributeError, TypeError):
            return []
