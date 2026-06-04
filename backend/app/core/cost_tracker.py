from __future__ import annotations
import logging
from typing import Any

logger = logging.getLogger(__name__)

PRICE_INPUT_PER_M = 0.150   # $0.150 per 1M input tokens
PRICE_OUTPUT_PER_M = 0.600  # $0.600 per 1M output tokens
DAILY_ALERT_THRESHOLD = 0.50  # dollars per user per day


class CostTracker:
    """
    Monitors token cost per user and emits alerts when daily threshold is exceeded.

    calculate_cost() is a pure function with no side effects.
    log_and_check() persists cost and triggers alert if daily total > $0.50.

    Attributes:
        repository: CostRepository for persisting and querying daily costs.
    """

    def __init__(self, repository: Any):
        self.repository = repository

    def calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """
        Calculates cost for a single LLM call. Pure function — no side effects.

        Args:
            input_tokens: Number of input/prompt tokens.
            output_tokens: Number of output/completion tokens.

        Returns:
            Cost in USD.
        """
        input_cost = (input_tokens / 1_000_000) * PRICE_INPUT_PER_M
        output_cost = (output_tokens / 1_000_000) * PRICE_OUTPUT_PER_M
        return input_cost + output_cost

    async def log_and_check(
        self,
        user_id: str,
        input_tokens: int,
        output_tokens: int,
        operation: str,
    ) -> None:
        """
        Persists cost and warns if daily total exceeds threshold.

        Args:
            user_id: UUID of the user who triggered the LLM call.
            input_tokens: Input tokens consumed.
            output_tokens: Output tokens consumed.
            operation: Label for the call ("chat", "extraction", etc.).
        """
        cost = self.calculate_cost(input_tokens, output_tokens)
        await self.repository.add_cost(user_id=user_id, cost=cost, operation=operation)
        daily_total = await self.repository.get_daily_cost(user_id=user_id)

        if daily_total > DAILY_ALERT_THRESHOLD:
            logger.warning(
                "COST ALERT user=%s daily_cost=%.4f threshold=%.2f operation=%s",
                user_id,
                daily_total,
                DAILY_ALERT_THRESHOLD,
                operation,
            )
