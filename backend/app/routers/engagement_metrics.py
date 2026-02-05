import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.engagement_metric import EngagementMetric
from app.schemas.engagement_metric import (
    EngagementMetricCreate,
    EngagementMetricOut,
    EngagementMetricUpdate,
)

router = APIRouter(prefix="/api/engagement-metrics", tags=["engagement-metrics"])


@router.get("", response_model=list[EngagementMetricOut])
async def list_engagement(
    library_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EngagementMetric)
        .where(EngagementMetric.library_id == library_id)
        .order_by(EngagementMetric.date.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.post("", response_model=EngagementMetricOut, status_code=201)
async def create_engagement(
    data: EngagementMetricCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    metric = EngagementMetric(**data.model_dump())
    db.add(metric)
    await db.commit()
    await db.refresh(metric)
    return metric


@router.put("/{metric_id}", response_model=EngagementMetricOut)
async def update_engagement(
    metric_id: uuid.UUID,
    data: EngagementMetricUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    metric = await db.get(EngagementMetric, metric_id)
    if not metric:
        raise HTTPException(status_code=404, detail="Engagement metric not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(metric, key, val)
    await db.commit()
    await db.refresh(metric)
    return metric


@router.delete("/{metric_id}", status_code=204)
async def delete_engagement(
    metric_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    metric = await db.get(EngagementMetric, metric_id)
    if not metric:
        raise HTTPException(status_code=404, detail="Engagement metric not found")
    await db.delete(metric)
    await db.commit()
