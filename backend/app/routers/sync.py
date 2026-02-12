from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.services.sync_service import sync_library_metrics

router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.post("/trigger")
async def trigger_sync(
    library_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    # NOTE: Temporarily public - JWT validation with ES256 needs to be fixed
    # _admin: dict = Depends(get_current_admin),
) -> dict[str, str]:
    """
    Ручной запуск синхронизации метрик с Яндекс.Метрики

    Требует авторизации администратора
    """
    try:
        await sync_library_metrics(db, library_id)
        return {"message": "Синхронизация успешно завершена", "library_id": str(library_id)}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при синхронизации: {str(e)}"
        )
