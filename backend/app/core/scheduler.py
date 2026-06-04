from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.repositories.chat_repository import ChatRepository


class ConversationScheduler:
    """Archives inactive conversations every 15 minutes."""

    def __init__(self, chat_repository: ChatRepository):
        self.scheduler = AsyncIOScheduler()
        self.repository = chat_repository

    def start(self):
        """Registers auto-archive job and starts the scheduler."""
        self.scheduler.add_job(self._archive_inactive, "interval", minutes=15)
        self.scheduler.start()

    def stop(self):
        self.scheduler.shutdown(wait=False)

    async def _archive_inactive(self):
        """Archives conversations with inactivity > 2h."""
        cutoff = datetime.utcnow() - timedelta(hours=2)
        await self.repository.archive_before(cutoff)
