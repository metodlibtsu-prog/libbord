from __future__ import annotations

import datetime
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, get_db
from app.models.metric_counter import MetricCounter
from app.models.traffic_metric import TrafficMetric
from app.services.sync_service import sync_library_metrics

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/sync", tags=["sync"])

_BG_THRESHOLD_DAYS = 30  # periods longer than this run in background


async def _run_sync_bg(library_id: uuid.UUID, date_from: datetime.date, date_to: datetime.date) -> None:
    async with async_session() as db:
        try:
            await sync_library_metrics(db, library_id, date_from=date_from, date_to=date_to)
            logger.info("Background sync completed for library %s (%s → %s)", library_id, date_from, date_to)
        except Exception:
            logger.exception("Background sync failed for library %s", library_id)


@router.post("/trigger")
async def trigger_sync(
    background_tasks: BackgroundTasks,
    library_id: uuid.UUID,
    date_from: Optional[datetime.date] = Query(default=None),
    date_to: Optional[datetime.date] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Ручной запуск синхронизации метрик с Яндекс.Метрики.
    Периоды > 30 дней запускаются в фоне и отвечают немедленно.
    """
    effective_date_to = date_to or datetime.date.today()
    effective_date_from = date_from or (effective_date_to - datetime.timedelta(days=7))
    days = (effective_date_to - effective_date_from).days + 1

    period_info = {
        "date_from": str(effective_date_from),
        "date_to": str(effective_date_to),
        "days": days,
    }

    if days > _BG_THRESHOLD_DAYS:
        # Long sync — run in background, respond immediately
        background_tasks.add_task(_run_sync_bg, library_id, effective_date_from, effective_date_to)
        return {
            "message": f"Синхронизация запущена в фоне ({days} дн.). Данные появятся через несколько минут.",
            "background": True,
            "period": period_info,
        }

    # Short sync — run synchronously
    try:
        await sync_library_metrics(db, library_id, date_from=effective_date_from, date_to=effective_date_to)
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}\n{traceback.format_exc()}")

    traffic_count = (await db.execute(
        select(func.count()).select_from(TrafficMetric).where(TrafficMetric.library_id == library_id)
    )).scalar() or 0

    return {
        "message": "Синхронизация завершена",
        "background": False,
        "period": period_info,
        "diagnostics": {"traffic_metrics_rows": traffic_count},
    }
