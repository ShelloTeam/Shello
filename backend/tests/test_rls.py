import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.core.rls_validator import RLSValidator


TABLES = [
    "users",
    "diary_entries",
    "tasks",
    "conversations",
    "messages",
    "context_fragments",
    "onboarding_answers",
]


def make_mock_db(leak: str | None = None):
    """Returns a mock db. If leak is a table name, that table returns data cross-user."""
    db = MagicMock()

    def table_side_effect(table_name):
        t = MagicMock()
        t.select = MagicMock(return_value=t)
        t.neq = MagicMock(return_value=t)
        t.limit = MagicMock(return_value=t)
        if table_name == leak:
            t.execute = MagicMock(return_value=MagicMock(data=[{"id": "leaked"}]))
        else:
            t.execute = MagicMock(return_value=MagicMock(data=[]))
        return t

    db.table = MagicMock(side_effect=table_side_effect)
    return db


def test_rls_validator_has_validate_all_method():
    validator = RLSValidator(db=make_mock_db())
    assert hasattr(validator, "validate_all")


def test_rls_validator_can_be_instantiated():
    validator = RLSValidator(db=make_mock_db())
    assert validator is not None


@pytest.mark.asyncio
async def test_validate_all_returns_ok_when_all_tables_isolated():
    validator = RLSValidator(db=make_mock_db())
    result = await validator.validate_all()
    assert result["status"] == "ok"


@pytest.mark.asyncio
async def test_validate_all_returns_seven_tables():
    validator = RLSValidator(db=make_mock_db())
    result = await validator.validate_all()
    assert len(result["tables"]) == 7


@pytest.mark.asyncio
async def test_validate_all_table_names_match_expected():
    validator = RLSValidator(db=make_mock_db())
    result = await validator.validate_all()
    names = [t["table"] for t in result["tables"]]
    for table in TABLES:
        assert table in names


@pytest.mark.asyncio
async def test_validate_all_all_isolated_true_when_no_leak():
    validator = RLSValidator(db=make_mock_db())
    result = await validator.validate_all()
    assert all(t["isolated"] is True for t in result["tables"])


@pytest.mark.asyncio
async def test_validate_all_returns_fail_when_data_leaks():
    validator = RLSValidator(db=make_mock_db(leak="tasks"))
    result = await validator.validate_all()
    assert result["status"] == "fail"


@pytest.mark.asyncio
async def test_validate_all_marks_leaking_table_as_not_isolated():
    validator = RLSValidator(db=make_mock_db(leak="diary_entries"))
    result = await validator.validate_all()
    leaking = [t for t in result["tables"] if t["table"] == "diary_entries"]
    assert leaking[0]["isolated"] is False


@pytest.mark.asyncio
async def test_validate_all_non_leaking_tables_still_isolated():
    validator = RLSValidator(db=make_mock_db(leak="tasks"))
    result = await validator.validate_all()
    for t in result["tables"]:
        if t["table"] != "tasks":
            assert t["isolated"] is True
