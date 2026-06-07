import logging
import threading
import time

from app.jobs.conversation_archiver import archive_inactive_conversations

logger = logging.getLogger(__name__)

INTERVAL_SECONDS = 15 * 60  # 15 minutos
_scheduler_thread: threading.Thread | None = None
_stop_event = threading.Event()


def _run_loop() -> None:
    """Loop do scheduler rodando em thread separada."""
    logger.info("Scheduler iniciado | intervalo=%ds", INTERVAL_SECONDS)
    while not _stop_event.is_set():
        try:
            archive_inactive_conversations()
        except Exception:
            # Erro já logado no archiver — scheduler não deve parar por falha pontual
            pass
        # Espera interrompível: acorda se _stop_event for setado antes dos 15min
        _stop_event.wait(timeout=INTERVAL_SECONDS)
    logger.info("Scheduler encerrado.")


def start_scheduler() -> None:
    """Inicia o scheduler em background thread. Idempotente."""
    global _scheduler_thread
    if _scheduler_thread and _scheduler_thread.is_alive():
        logger.warning("Scheduler já está rodando — ignorando segunda chamada.")
        return
    _stop_event.clear()
    _scheduler_thread = threading.Thread(
        target=_run_loop,
        name="conversation-archiver",
        daemon=True,  # Thread daemon: encerra junto com o processo principal
    )
    _scheduler_thread.start()


def stop_scheduler() -> None:
    """Para o scheduler de forma limpa (usado no shutdown do app)."""
    _stop_event.set()
    if _scheduler_thread:
        _scheduler_thread.join(timeout=5)
    logger.info("Scheduler parado.")