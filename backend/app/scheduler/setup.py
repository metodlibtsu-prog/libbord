from __future__ import annotations

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.scheduler.jobs import daily_sync_job

logger = logging.getLogger(__name__)

# Создаём экземпляр планировщика
scheduler = AsyncIOScheduler()


def start_scheduler():
    """
    Запуск планировщика и настройка заданий

    Настроено задание:
    - daily_sync_job: ежедневно в 3:00 (время сервера)
    """
    # Синхронизация каждые 4 часа
    scheduler.add_job(
        daily_sync_job,
        trigger=IntervalTrigger(hours=4),
        id="periodic_sync",
        name="Periodic Yandex.Metrika sync (every 4h)",
        replace_existing=True,
    )

    logger.info("Starting APScheduler")
    scheduler.start()
    logger.info("APScheduler started successfully")


def stop_scheduler():
    """Остановка планировщика"""
    logger.info("Stopping APScheduler")
    scheduler.shutdown()
    logger.info("APScheduler stopped")
