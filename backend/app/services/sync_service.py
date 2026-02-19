from __future__ import annotations

import datetime
import logging
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.models.yandex_token import YandexToken
from app.models.metric_counter import MetricCounter, SyncStatus
from app.models.traffic_metric import TrafficMetric
from app.models.channel import Channel
from app.services.yandex_metrika import YandexMetrikaService

logger = logging.getLogger(__name__)


async def sync_library_metrics(
    db: AsyncSession,
    library_id: uuid.UUID,
    date_from: datetime.date | None = None,
    date_to: datetime.date | None = None,
) -> None:
    """
    Синхронизация метрик для библиотеки из Яндекс.Метрики

    1. Получить токен для библиотеки
    2. Проверить срок действия токена, обновить при необходимости
    3. Получить все активные счётчики библиотеки
    4. Для каждого счётчика:
       a. Обновить sync_status на 'syncing'
       b. Получить метрики за указанный период (по умолчанию: последние 7 дней)
       c. Сохранить метрики в traffic_metrics (upsert)
       d. Обновить last_sync_at, sync_status='success'
    5. Обработать ошибки: sync_status='error', sync_error_message
    """
    logger.info(f"Starting sync for library {library_id}")

    # 1. Get Yandex token for library
    result = await db.execute(
        select(YandexToken).where(YandexToken.library_id == library_id)
    )
    token = result.scalar_one_or_none()

    if not token:
        logger.warning(f"No Yandex token found for library {library_id}")
        return

    # 2. Check token expiry and refresh if needed
    now = datetime.datetime.utcnow()
    expires_at = token.expires_at.replace(tzinfo=None) if token.expires_at and token.expires_at.tzinfo else token.expires_at
    if expires_at and expires_at < now:
        logger.info("Token expired, refreshing...")
        try:
            new_token_data = await YandexMetrikaService.refresh_access_token(
                token.refresh_token
            )
            token.access_token = new_token_data["access_token"]
            token.refresh_token = (
                new_token_data["refresh_token"] or token.refresh_token
            )
            token.expires_at = new_token_data["expires_at"]
            token.updated_at = now
            await db.commit()
            await db.refresh(token)
            logger.info("Token refreshed successfully")
        except Exception as e:
            logger.error(f"Failed to refresh token: {e}")
            return

    # 3. Get all active counters for library
    result = await db.execute(
        select(MetricCounter).where(
            MetricCounter.library_id == library_id, MetricCounter.is_active == True
        )
    )
    counters = result.scalars().all()

    if not counters:
        logger.info(f"No active counters found for library {library_id}")
        return

    # Get all non-manual channels and build name->channel map
    channels_result = await db.execute(
        select(Channel).where(
            Channel.library_id == library_id,
            Channel.is_manual == False,
        )
    )
    all_channels = channels_result.scalars().all()
    # Map by stripped custom_name for matching with counter name
    channel_by_name = {
        (ch.custom_name or "").strip(): ch for ch in all_channels
    }

    logger.info(f"Found {len(counters)} active counters, {len(all_channels)} channels to sync")

    # 4. Sync each counter
    async with YandexMetrikaService(token.access_token) as ym_service:
        for counter in counters:
            try:
                logger.info(f"Syncing counter {counter.id} ({counter.name})")

                # a. Set syncing status
                counter.sync_status = SyncStatus.SYNCING
                counter.sync_error_message = None
                await db.commit()

                # b. Fetch metrics for the requested period (default: last 7 days)
                effective_date_to = date_to or datetime.date.today()
                effective_date_from = date_from or (effective_date_to - datetime.timedelta(days=7))

                logger.info(
                    f"Fetching metrics from {effective_date_from} to {effective_date_to}"
                    f" ({(effective_date_to - effective_date_from).days + 1} days)"
                )

                metrics_data = await ym_service.fetch_metrics(
                    counter.yandex_counter_id, effective_date_from, effective_date_to
                )

                # Match counter to its channel by name
                counter_name = (counter.name or "").strip()
                channel = channel_by_name.get(counter_name)

                if not channel and all_channels:
                    # Fallback: try to find by partial match
                    for ch in all_channels:
                        ch_name = (ch.custom_name or "").strip()
                        if ch_name and counter_name and (
                            ch_name in counter_name or counter_name in ch_name
                        ):
                            channel = ch
                            break

                if not channel:
                    logger.warning(f"No matching channel found for counter '{counter_name}'")
                    counter.sync_status = SyncStatus.ERROR
                    counter.sync_error_message = f"No matching channel for '{counter_name}'"
                    await db.commit()
                    continue

                # c. Upsert traffic metrics
                for date_str, metrics in metrics_data.items():
                    date_obj = datetime.date.fromisoformat(date_str)

                    # Prepare upsert statement
                    stmt = insert(TrafficMetric).values(
                        library_id=library_id,
                        channel_id=channel.id,
                        counter_id=counter.id,
                        date=date_obj,
                        views=metrics["views"],
                        visits=metrics["visits"],
                        users=metrics["users"],
                        avg_time=metrics["avg_time"],
                        depth=metrics["depth"],
                        bounce_rate=metrics["bounce_rate"],
                        return_rate=metrics["return_rate"],
                    )

                    # On conflict, update all fields
                    stmt = stmt.on_conflict_do_update(
                        index_elements=["library_id", "channel_id", "counter_id", "date"],
                        set_={
                            "views": stmt.excluded.views,
                            "visits": stmt.excluded.visits,
                            "users": stmt.excluded.users,
                            "avg_time": stmt.excluded.avg_time,
                            "depth": stmt.excluded.depth,
                            "bounce_rate": stmt.excluded.bounce_rate,
                            "return_rate": stmt.excluded.return_rate,
                        },
                    )

                    await db.execute(stmt)

                await db.commit()

                # d. Update sync status
                counter.sync_status = SyncStatus.SUCCESS
                counter.last_sync_at = datetime.datetime.utcnow()
                counter.sync_error_message = None
                await db.commit()

                logger.info(
                    f"Successfully synced counter {counter.id} with {len(metrics_data)} days of data"
                )

            except Exception as e:
                logger.error(f"Error syncing counter {counter.id}: {e}", exc_info=True)

                # Set error status
                counter.sync_status = SyncStatus.ERROR
                counter.sync_error_message = str(e)[:500]  # Truncate to 500 chars
                await db.commit()

    logger.info(f"Finished sync for library {library_id}")
