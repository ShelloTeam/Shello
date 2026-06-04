from abc import ABC, abstractmethod


class LLMProvider(ABC):
    """
    Abstract base class for LLM providers.

    Implementations must provide generate() and moderate().
    LLMProviderError is the only exception that should escape the interface.
    """

    @abstractmethod
    async def generate(
        self,
        system_prompt: str,
        history: list[dict],
        user_message: str,
    ) -> str:
        """
        Generates a response from the LLM.

        Args:
            system_prompt: System instructions for the model.
            history: Prior conversation turns as list of {role, content} dicts.
            user_message: Current user message.

        Returns:
            Generated text response.

        Raises:
            LLMProviderError: On any API failure.
        """

    @abstractmethod
    async def moderate(self, content: str) -> bool:
        """
        Checks content against moderation API.

        Args:
            content: Text to check.

        Returns:
            True if content is safe, False if flagged.

        Raises:
            LLMProviderError: On any API failure.
        """
