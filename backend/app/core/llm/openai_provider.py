from openai import AsyncOpenAI
from app.core.llm.base import LLMProvider
from app.core.llm.exceptions import LLMProviderError


class OpenAIProvider(LLMProvider):
    """
    OpenAI implementation of LLMProvider using gpt-4o-mini.

    Model and temperature are hardcoded constants — never dynamic.
    Cost tracking is delegated to callers via usage metadata.

    Attributes:
        MODEL: Fixed model ID. Never use 'latest' or dynamic values.
        TEMPERATURE: Fixed generation temperature.
    """

    MODEL = "gpt-4o-mini-2024-07-18"
    TEMPERATURE = 0.7

    def __init__(self, api_key: str):
        self._client = AsyncOpenAI(api_key=api_key)

    async def generate(
        self,
        system_prompt: str,
        history: list[dict],
        user_message: str,
    ) -> str:
        """
        Calls OpenAI chat completions with fixed model and temperature.

        Raises:
            LLMProviderError: Wraps any OpenAI API exception.
        """
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})
        try:
            response = await self._client.chat.completions.create(
                model=self.MODEL,
                temperature=self.TEMPERATURE,
                messages=messages,
            )
            return response.choices[0].message.content
        except Exception as exc:
            raise LLMProviderError(f"OpenAI generate failed: {exc}") from exc

    async def moderate(self, content: str) -> bool:
        """
        Checks content via OpenAI Moderation API.

        Returns:
            True if safe, False if flagged.

        Raises:
            LLMProviderError: Wraps any OpenAI API exception.
        """
        try:
            result = await self._client.moderations.create(input=content)
            return not result.results[0].flagged
        except Exception as exc:
            raise LLMProviderError(f"OpenAI moderate failed: {exc}") from exc
