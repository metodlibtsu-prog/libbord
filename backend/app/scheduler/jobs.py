from __future__ import annotations

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.library import Library
from app.models.vk_config import VkConfig
from app.models.yandex_token import YandexToken
from app.services.sync_service import sync_library_metrics
from app.services.vk_sync_service import sync_vk

logger = logging.getLogger(__name__)


async def daily_sync_job():
    """
    Ежедневная синхронизация метрик для всех библиотек с подключённой Яндекс.Метрикой

    Запускается по расписанию в 3:00 каждый день
    """
    logger.info("Starting daily sync job")

    async with async_session() as db:
        try:
            # Получаем все библиотеки, у которых есть токен Яндекс.Метрики
            result = await db.execute(
                select(Library)
                .join(YandexToken, Library.id == YandexToken.library_id)
            )
            libraries = result.scalars().all()

            if not libraries:
                logger.info("No libraries with Yandex tokens found")
                return

            logger.info(f"Found {len(libraries)} libraries to sync")

            # Синхронизируем каждую библиотеку
            for library in libraries:
                try:
                    logger.info(f"Syncing library {library.id} ({library.name})")
                    await sync_library_metrics(db, library.id)
                    logger.info(f"Successfully synced library {library.id}")
                except Exception as e:
                    logger.error(
                        f"Failed to sync library {library.id}: {e}", exc_info=True
                    )
                    # Продолжаем синхронизацию других библиотек

            logger.info("Yandex sync completed")

            # VK sync for all configured libraries
            vk_result = await db.execute(select(Library).join(VkConfig, Library.id == VkConfig.library_id))
            vk_libraries = vk_result.scalars().all()
            for library in vk_libraries:
                try:
                    logger.info(f"VK sync for library {library.id}")
                    await sync_vk(db, library.id)
                except Exception as e:
                    logger.error(f"VK sync failed for {library.id}: {e}", exc_info=True)

            logger.info("Daily sync job completed")

        except Exception as e:
            logger.error(f"Daily sync job failed: {e}", exc_info=True)
