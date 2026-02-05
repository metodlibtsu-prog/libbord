import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.dashboard import (
    BehaviorData,
    ChannelMetric,
    ChannelTrendPoint,
    EngagementData,
    KpiOverview,
    Period,
    ReviewsResponse,
)
from app.schemas.insights import Insight
from app.services import dashboard_service
from app.services.insights_engine import generate_insights

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=KpiOverview)
async def overview(
    library_id: uuid.UUID,
    period: Period = Period.month,
    counter_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_overview(db, library_id, period, counter_id)


@router.get("/channels", response_model=list[ChannelMetric])
async def channels(
    library_id: uuid.UUID,
    period: Period = Period.month,
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_channels(db, library_id, period)


@router.get("/channels/trend", response_model=list[ChannelTrendPoint])
async def channel_trend(
    library_id: uuid.UUID,
    channel_id: uuid.UUID,
    period: Period = Period.month,
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_channel_trend(db, library_id, channel_id, period)


@router.get("/behavior", response_model=BehaviorData)
async def behavior(
    library_id: uuid.UUID,
    period: Period = Period.month,
    counter_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_behavior(db, library_id, period, counter_id)


@router.get("/engagement", response_model=EngagementData)
async def engagement(
    library_id: uuid.UUID,
    period: Period = Period.month,
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_engagement(db, library_id, period)


@router.get("/reviews", response_model=ReviewsResponse)
async def reviews(
    library_id: uuid.UUID,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_reviews(db, library_id, limit, offset)


@router.get("/insights", response_model=list[Insight])
async def insights(
    library_id: uuid.UUID,
    period: Period = Period.month,
    counter_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    overview_data = await dashboard_service.get_overview(db, library_id, period, counter_id)
    behavior_data = await dashboard_service.get_behavior(db, library_id, period, counter_id)
    engagement_data = await dashboard_service.get_engagement(db, library_id, period)
    return generate_insights(overview_data, behavior_data, engagement_data)
