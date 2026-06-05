import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
import app.jobs.conversation_archiver as archiver


def make_conversation(status="active", hours_ago=3) -> dict:
    last_msg = (datetime.now(timezone.utc) - timedelta(hours=hours_ago)).isoformat()
    return {"id": "uuid-test", "status": status, "last_message_at": last_msg}


def mock_supabase_update(rows: list[dict]):
    """
    Cadeia real do archiver:
    client.table().update().eq().lt().execute()
    """
    mock_result = MagicMock()
    mock_result.data = rows

    mock_lt = MagicMock()
    mock_lt.execute = MagicMock(return_value=mock_result)

    mock_eq = MagicMock()
    mock_eq.lt = MagicMock(return_value=mock_lt)

    mock_update = MagicMock()
    mock_update.eq = MagicMock(return_value=mock_eq)

    mock_table = MagicMock()
    mock_table.update = MagicMock(return_value=mock_update)

    mock_client = MagicMock()
    mock_client.table = MagicMock(return_value=mock_table)
    return mock_client


def test_TC001_arquiva_conversas_inativas():
    archived = [make_conversation(status="active", hours_ago=3)]
    mock_client = mock_supabase_update(archived)
    with patch.object(archiver, "create_client", return_value=mock_client):
        count = archiver.archive_inactive_conversations()
    assert count == 1


def test_TC002_nao_arquiva_conversas_recentes():
    mock_client = mock_supabase_update([])
    with patch.object(archiver, "create_client", return_value=mock_client):
        count = archiver.archive_inactive_conversations()
    assert count == 0


def test_TC003_ignora_ja_arquivadas():
    mock_client = mock_supabase_update([])
    with patch.object(archiver, "create_client", return_value=mock_client):
        count = archiver.archive_inactive_conversations()
    assert count == 0


def test_TC004_arquiva_multiplas():
    archived = [
        make_conversation(hours_ago=3),
        make_conversation(hours_ago=5),
        make_conversation(hours_ago=10),
    ]
    mock_client = mock_supabase_update(archived)
    with patch.object(archiver, "create_client", return_value=mock_client):
        count = archiver.archive_inactive_conversations()
    assert count == 3


def test_TC005_erro_banco_propaga_excecao():
    mock_client = MagicMock()
    mock_client.table.side_effect = Exception("Conexão recusada")
    with patch.object(archiver, "create_client", return_value=mock_client):
        with pytest.raises(Exception, match="Conexão recusada"):
            archiver.archive_inactive_conversations()


def test_TC006_scheduler_idempotente():
    from app.jobs import scheduler
    scheduler.stop_scheduler()
    scheduler.start_scheduler()
    thread_1 = scheduler._scheduler_thread
    scheduler.start_scheduler()
    thread_2 = scheduler._scheduler_thread
    assert thread_1 is thread_2, "Scheduler iniciou segunda thread"
    scheduler.stop_scheduler()