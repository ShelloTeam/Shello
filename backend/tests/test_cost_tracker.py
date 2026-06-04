import pytest
from unittest.mock import AsyncMock, MagicMock
from app.core.cost_tracker import CostTracker


def make_mock_repo(daily_cost=0.0):
    repo = MagicMock()
    repo.get_daily_cost = AsyncMock(return_value=daily_cost)
    repo.add_cost = AsyncMock(return_value=None)
    return repo


def test_calculate_cost_returns_correct_value():
    tracker = CostTracker(repository=make_mock_repo())
    cost = tracker.calculate_cost(input_tokens=1000, output_tokens=500)
    # input:  1000/1_000_000 * 0.150 = 0.00015
    # output:  500/1_000_000 * 0.600 = 0.00030
    assert abs(cost - 0.00045) < 0.000001


def test_calculate_cost_is_pure_function():
    tracker = CostTracker(repository=make_mock_repo())
    cost1 = tracker.calculate_cost(1000, 500)
    cost2 = tracker.calculate_cost(1000, 500)
    assert cost1 == cost2


def test_calculate_cost_zero_tokens():
    tracker = CostTracker(repository=make_mock_repo())
    assert tracker.calculate_cost(0, 0) == 0.0


def test_calculate_cost_only_input():
    tracker = CostTracker(repository=make_mock_repo())
    cost = tracker.calculate_cost(input_tokens=1_000_000, output_tokens=0)
    assert abs(cost - 0.150) < 0.000001


@pytest.mark.asyncio
async def test_log_and_check_no_alert_when_below_threshold():
    repo = make_mock_repo(daily_cost=0.10)
    tracker = CostTracker(repository=repo)

    with patch_logger() as mock_logger:
        await tracker.log_and_check("user-1", 1000, 500, "chat")
        mock_logger.warning.assert_not_called()


@pytest.mark.asyncio
async def test_log_and_check_triggers_alert_when_above_threshold(caplog):
    import logging
    repo = make_mock_repo(daily_cost=0.51)
    tracker = CostTracker(repository=repo)

    with caplog.at_level(logging.WARNING):
        await tracker.log_and_check("user-1", 1000, 500, "chat")

    assert "COST ALERT" in caplog.text


@pytest.mark.asyncio
async def test_log_and_check_no_alert_when_at_threshold(caplog):
    import logging
    repo = make_mock_repo(daily_cost=0.49)
    tracker = CostTracker(repository=repo)

    with caplog.at_level(logging.WARNING):
        await tracker.log_and_check("user-1", 1000, 500, "chat")

    assert "COST ALERT" not in caplog.text


@pytest.mark.asyncio
async def test_log_and_check_adds_cost_to_repo():
    repo = make_mock_repo(daily_cost=0.10)
    tracker = CostTracker(repository=repo)
    await tracker.log_and_check("user-1", 1000, 500, "chat")
    repo.add_cost.assert_called_once()


def patch_logger():
    from unittest.mock import patch
    return patch("app.core.cost_tracker.logger")
