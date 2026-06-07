import logging
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

INACTIVITY_THRESHOLD_HOURS = 2


def archive_inactive_conversations() -> int:
    """
    Arquiva conversas com last_message_at < now() - 2h e status = 'active'.
    Retorna o número de conversas arquivadas.
    Seguro para rodar concorrentemente — filtro por status evita duplo arquivo.
    """
    client: Client = create_client(settings.supabase_url, settings.supabase_key)

    cutoff = (
        datetime.now(timezone.utc) - timedelta(hours=INACTIVITY_THRESHOLD_HOURS)
    ).isoformat()

    try:
        result = (
            client.table("conversations")
            .update({"status": "archived"})
            .eq("status", "active")
            .lt("last_message_at", cutoff)
            .execute()
        )
        count = len(result.data) if result.data else 0
        if count > 0:
            logger.info("Arquivamento: %d conversa(s) arquivada(s) | cutoff=%s", count, cutoff)
        else:
            logger.debug("Arquivamento: nenhuma conversa inativa encontrada | cutoff=%s", cutoff)
        return count
    except Exception:
        logger.exception("Erro no job de arquivamento de conversas")
        raise