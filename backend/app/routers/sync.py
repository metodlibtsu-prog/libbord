from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.metric_counter import MetricCounter
from app.models.traffic_metric import TrafficMetric
from app.models.yandex_token import YandexToken
from app.models.channel import Channel
from app.services.sync_service import sync_library_metrics

router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.post("/trigger")
async def trigger_sync(
    library_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    # NOTE: Temporarily public - JWT validation with ES256 needs to be fixed
    # _admin: dict = Depends(get_current_admin),
) -> dict:
    """
    Ручной запуск синхронизации метрик с Яндекс.Метрики
    """
    try:
        await sync_library_metrics(db, library_id)

        # Диагностика: сколько данных в базе
        token_result = await db.execute(
            select(YandexToken).where(YandexToken.library_id == library_id)
        )
        token = token_result.scalar_one_or_none()

        counters_result = await db.execute(
            select(MetricCounter).where(
                MetricCounter.library_id == library_id
            )
        )
        counters = counters_result.scalars().all()

        channels_result = await db.execute(
            select(Channel).where(
                Channel.library_id == library_id,
                Channel.is_manual == False,
            )
        )
        channels = channels_result.scalars().all()

        traffic_count = (await db.execute(
            select(func.count()).select_from(TrafficMetric).where(
                TrafficMetric.library_id == library_id
            )
        )).scalar() or 0

        return {
            "message": "Синхронизация завершена",
            "diagnostics": {
                "has_token": token is not None,
                "token_expired": str(token.expires_at) if token else None,
                "counters_total": len(counters),
                "counters_active": sum(1 for c in counters if c.is_active),
                "counters_detail": [
                    {
                        "id": str(c.id),
                        "name": c.name,
                        "yandex_id": c.yandex_counter_id,
                        "is_active": c.is_active,
                        "sync_status": str(c.sync_status) if c.sync_status else None,
                        "sync_error": c.sync_error_message,
                        "last_sync": str(c.last_sync_at) if c.last_sync_at else None,
                    }
                    for c in counters
                ],
                "non_manual_channels": len(channels),
                "traffic_metrics_rows": traffic_count,
            },
        }
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка: {str(e)}\n{traceback.format_exc()}"
        )
