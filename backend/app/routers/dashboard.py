import uuid
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.engagement_metric import EngagementMetric
from app.models.vk_metric import VkMetric
from app.models.vk_upload import VkUpload
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
from app.schemas.vk import (
    VkContentPoint,
    VkEngagementPoint,
    VkKpi,
    VkPeriodInfo,
    VkReachPoint,
    VkStatsResponse,
    VkTopPost,
)
from app.services import dashboard_service
from app.services.insights_engine import generate_insights, generate_vk_insights
from app.services.period import resolve_period_or_custom

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=KpiOverview)
async def overview(
    library_id: uuid.UUID,
    period: Period = Period.month,
    counter_id: uuid.UUID | None = None,
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_overview(db, library_id, period, counter_id, date_from, date_to)


@router.get("/channels", response_model=list[ChannelMetric])
async def channels(
    library_id: uuid.UUID,
    period: Period = Period.month,
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_channels(db, library_id, period, date_from, date_to)


@router.get("/channels/trend", response_model=list[ChannelTrendPoint])
async def channel_trend(
    library_id: uuid.UUID,
    channel_id: uuid.UUID,
    period: Period = Period.month,
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_channel_trend(db, library_id, channel_id, period, date_from, date_to)


@router.get("/behavior", response_model=BehaviorData)
async def behavior(
    library_id: uuid.UUID,
    period: Period = Period.month,
    counter_id: uuid.UUID | None = None,
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_behavior(db, library_id, period, counter_id, date_from, date_to)


@router.get("/engagement", response_model=EngagementData)
async def engagement(
    library_id: uuid.UUID,
    period: Period = Period.month,
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_engagement(db, library_id, period, date_from, date_to)


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
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    overview_data = await dashboard_service.get_overview(db, library_id, period, counter_id, date_from, date_to)
    behavior_data = await dashboard_service.get_behavior(db, library_id, period, counter_id, date_from, date_to)
    engagement_data = await dashboard_service.get_engagement(db, library_id, period, date_from, date_to)
    return generate_insights(overview_data, behavior_data, engagement_data)


@router.get("/vk", response_model=VkStatsResponse)
async def vk_stats(
    library_id: uuid.UUID,
    period: Period = Period.month,
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get VK statistics for public dashboard"""
    # Determine date range
    today = date.today()
    resolved_from, resolved_to, _, _ = resolve_period_or_custom(period, date_from, date_to)

    # Get latest upload info
    upload_query = select(VkUpload).where(
        VkUpload.library_id == library_id,
        VkUpload.status == "completed"
    ).order_by(VkUpload.uploaded_at.desc()).limit(1)
    upload_result = await db.execute(upload_query)
    latest_upload = upload_result.scalar_one_or_none()

    # Fetch VK metrics
    vk_query = select(VkMetric).where(
        VkMetric.library_id == library_id,
        VkMetric.date >= resolved_from,
        VkMetric.date <= resolved_to,
    ).order_by(VkMetric.date.asc())
    vk_result = await db.execute(vk_query)
    vk_metrics = vk_result.scalars().all()

    # Fetch engagement metrics
    eng_query = select(EngagementMetric).where(
        EngagementMetric.library_id == library_id,
        EngagementMetric.date >= resolved_from,
        EngagementMetric.date <= resolved_to,
    ).order_by(EngagementMetric.date.asc())
    eng_result = await db.execute(eng_query)
    eng_metrics = eng_result.scalars().all()

    if not vk_metrics:
        raise HTTPException(status_code=404, detail="No VK data found")

    # Calculate KPIs for current period
    total_reach = sum(m.visitors for m in vk_metrics)
    total_views = sum(m.views for m in vk_metrics)
    latest_subscribers = vk_metrics[-1].total_subscribers if vk_metrics else 0
    total_likes = sum(m.likes for m in eng_metrics)
    total_reposts = sum(m.reposts for m in eng_metrics)
    total_comments = sum(m.comments for m in eng_metrics)
    total_engagement = total_likes + total_reposts + total_comments
    er_pct = (total_engagement / total_reach * 100) if total_reach > 0 else 0

    # Calculate previous period for comparison
    period_days = (resolved_to - resolved_from).days + 1
    prev_date_to = resolved_from - timedelta(days=1)
    prev_date_from = prev_date_to - timedelta(days=period_days - 1)

    # Fetch previous period metrics
    prev_vk_query = select(VkMetric).where(
        VkMetric.library_id == library_id,
        VkMetric.date >= prev_date_from,
        VkMetric.date <= prev_date_to,
    )
    prev_vk_result = await db.execute(prev_vk_query)
    prev_vk_metrics = prev_vk_result.scalars().all()

    # Calculate deltas
    reach_delta_pct = None
    views_delta_pct = None
    subscribers_delta_pct = None

    if prev_vk_metrics:
        prev_reach = sum(m.visitors for m in prev_vk_metrics)
        prev_views = sum(m.views for m in prev_vk_metrics)
        prev_subscribers = prev_vk_metrics[-1].total_subscribers if prev_vk_metrics else 0

        if prev_reach > 0:
            reach_delta_pct = round(((total_reach - prev_reach) / prev_reach) * 100, 1)
        if prev_views > 0:
            views_delta_pct = round(((total_views - prev_views) / prev_views) * 100, 1)
        if prev_subscribers > 0:
            subscribers_delta_pct = round(((latest_subscribers - prev_subscribers) / prev_subscribers) * 100, 1)

    kpis = VkKpi(
        reach=total_reach,
        views=total_views,
        subscribers=latest_subscribers,
        er_pct=round(er_pct, 2),
        reposts=total_reposts,
        comments=total_comments,
        reach_delta_pct=reach_delta_pct,
        views_delta_pct=views_delta_pct,
        subscribers_delta_pct=subscribers_delta_pct,
        er_delta_pct=None,
    )

    # Build reach trend
    reach_trend = [
        VkReachPoint(date=str(m.date), reach=m.visitors, views=m.views) for m in vk_metrics
    ]

    # Build engagement trend
    engagement_trend = []
    for m in eng_metrics:
        vk_m = next((v for v in vk_metrics if v.date == m.date), None)
        reach = vk_m.visitors if vk_m else 0
        total_eng = m.likes + m.reposts + m.comments
        er = (total_eng / reach * 100) if reach > 0 else 0
        engagement_trend.append(
            VkEngagementPoint(
                date=str(m.date),
                likes=m.likes,
                reposts=m.reposts,
                comments=m.comments,
                er=round(er, 2),
            )
        )

    # Build content trend
    content_trend = [
        VkContentPoint(
            date=str(m.date),
            posts=m.posts,
            stories=m.stories,
            clips=m.clips,
            videos=m.videos,
        )
        for m in vk_metrics
    ]

    # Build top posts (simplified)
    top_posts = []
    for m in eng_metrics[:10]:
        vk_m = next((v for v in vk_metrics if v.date == m.date), None)
        reach = vk_m.visitors if vk_m else 0
        total_eng = m.likes + m.reposts + m.comments
        er = (total_eng / reach * 100) if reach > 0 else 0
        content_type = "Пост"
        if vk_m:
            if vk_m.stories > 0:
                content_type = "История"
            elif vk_m.clips > 0:
                content_type = "Клип"
            elif vk_m.videos > 0:
                content_type = "Видео"
        top_posts.append(
            VkTopPost(
                date=str(m.date),
                type=content_type,
                reach=reach,
                er=round(er, 2),
                likes=m.likes,
                comments=m.comments,
            )
        )
    top_posts.sort(key=lambda x: x.er, reverse=True)
    top_posts = top_posts[:10]

    # Period info
    period_info = VkPeriodInfo(
        start=str(resolved_from),
        end=str(resolved_to),
        upload_date=str(latest_upload.uploaded_at.date()) if latest_upload else None,
    )

    # Generate insights
    insights = generate_vk_insights(kpis)

    return VkStatsResponse(
        kpis=kpis,
        reach_trend=reach_trend,
        engagement_trend=engagement_trend,
        content_trend=content_trend,
        top_posts=top_posts,
        period_info=period_info,
        insights=insights,
    )
