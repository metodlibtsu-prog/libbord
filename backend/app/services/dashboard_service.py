import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.channel import Channel
from app.models.engagement_metric import EngagementMetric
from app.models.review import Review
from app.models.traffic_metric import TrafficMetric
from app.schemas.dashboard import (
    BehaviorData,
    BehaviorPoint,
    ChannelMetric,
    ChannelTrendPoint,
    EngagementData,
    EngagementPoint,
    KpiOverview,
    Period,
    ReviewItem,
    ReviewsResponse,
)
from app.services.period import calc_delta_pct, resolve_period


async def get_overview(
    db: AsyncSession,
    library_id: uuid.UUID,
    period: Period,
    counter_id: uuid.UUID | None = None,
) -> KpiOverview:
    date_from, date_to, prev_from, prev_to = resolve_period(period)

    async def _sum_traffic(d_from, d_to):
        q = select(
            func.coalesce(func.sum(TrafficMetric.views), 0),
            func.coalesce(func.sum(TrafficMetric.visits), 0),
            func.coalesce(func.sum(TrafficMetric.users), 0),
        ).where(
            TrafficMetric.library_id == library_id,
            TrafficMetric.date >= d_from,
            TrafficMetric.date <= d_to,
        )
        if counter_id:
            q = q.where(TrafficMetric.counter_id == counter_id)
        row = (await db.execute(q)).one()
        return row[0], row[1], row[2]

    cur_views, cur_visits, cur_users = await _sum_traffic(date_from, date_to)
    prev_views, prev_visits, prev_users = await _sum_traffic(prev_from, prev_to)

    return KpiOverview(
        views=cur_views,
        visits=cur_visits,
        users=cur_users,
        active_users=cur_users,  # alias for now
        views_delta_pct=calc_delta_pct(cur_views, prev_views),
        visits_delta_pct=calc_delta_pct(cur_visits, prev_visits),
        users_delta_pct=calc_delta_pct(cur_users, prev_users),
        active_users_delta_pct=calc_delta_pct(cur_users, prev_users),
    )


async def get_channels(
    db: AsyncSession,
    library_id: uuid.UUID,
    period: Period,
) -> list[ChannelMetric]:
    date_from, date_to, _, _ = resolve_period(period)

    q = (
        select(
            Channel.id,
            Channel.type,
            Channel.custom_name,
            func.coalesce(func.sum(TrafficMetric.views), 0),
            func.coalesce(func.sum(TrafficMetric.visits), 0),
            func.coalesce(func.sum(TrafficMetric.users), 0),
        )
        .outerjoin(TrafficMetric, (TrafficMetric.channel_id == Channel.id) & (TrafficMetric.date >= date_from) & (TrafficMetric.date <= date_to))
        .where(Channel.library_id == library_id)
        .group_by(Channel.id, Channel.type, Channel.custom_name)
    )

    rows = (await db.execute(q)).all()
    return [
        ChannelMetric(
            channel_id=r[0],
            channel_type=r[1],
            custom_name=r[2],
            views=r[3],
            visits=r[4],
            users=r[5],
        )
        for r in rows
    ]


async def get_channel_trend(
    db: AsyncSession,
    library_id: uuid.UUID,
    channel_id: uuid.UUID,
    period: Period,
) -> list[ChannelTrendPoint]:
    date_from, date_to, _, _ = resolve_period(period)

    q = (
        select(
            TrafficMetric.date,
            func.sum(TrafficMetric.views),
            func.sum(TrafficMetric.visits),
            func.sum(TrafficMetric.users),
        )
        .where(
            TrafficMetric.library_id == library_id,
            TrafficMetric.channel_id == channel_id,
            TrafficMetric.date >= date_from,
            TrafficMetric.date <= date_to,
        )
        .group_by(TrafficMetric.date)
        .order_by(TrafficMetric.date)
    )

    rows = (await db.execute(q)).all()
    return [
        ChannelTrendPoint(date=r[0], views=r[1], visits=r[2], users=r[3])
        for r in rows
    ]


async def get_behavior(
    db: AsyncSession,
    library_id: uuid.UUID,
    period: Period,
    counter_id: uuid.UUID | None = None,
) -> BehaviorData:
    date_from, date_to, prev_from, prev_to = resolve_period(period)

    async def _avg_behavior(d_from, d_to):
        q = select(
            func.coalesce(func.avg(TrafficMetric.avg_time), 0),
            func.coalesce(func.avg(TrafficMetric.depth), 0),
            func.coalesce(func.avg(TrafficMetric.bounce_rate), 0),
            func.coalesce(func.avg(TrafficMetric.return_rate), 0),
        ).where(
            TrafficMetric.library_id == library_id,
            TrafficMetric.date >= d_from,
            TrafficMetric.date <= d_to,
        )
        if counter_id:
            q = q.where(TrafficMetric.counter_id == counter_id)
        row = (await db.execute(q)).one()
        return row[0], row[1], row[2], row[3]

    cur = await _avg_behavior(date_from, date_to)
    prev = await _avg_behavior(prev_from, prev_to)

    # Timeline
    q = (
        select(
            TrafficMetric.date,
            func.avg(TrafficMetric.avg_time),
            func.avg(TrafficMetric.depth),
            func.avg(TrafficMetric.bounce_rate),
            func.avg(TrafficMetric.return_rate),
        )
        .where(
            TrafficMetric.library_id == library_id,
            TrafficMetric.date >= date_from,
            TrafficMetric.date <= date_to,
        )
    )
    if counter_id:
        q = q.where(TrafficMetric.counter_id == counter_id)
    q = q.group_by(TrafficMetric.date).order_by(TrafficMetric.date)

    rows = (await db.execute(q)).all()
    timeline = [
        BehaviorPoint(
            date=r[0],
            avg_time=round(r[1], 1),
            depth=round(r[2], 2),
            bounce_rate=round(r[3], 1),
            return_rate=round(r[4], 1),
        )
        for r in rows
    ]

    return BehaviorData(
        timeline=timeline,
        avg_time_delta_pct=calc_delta_pct(cur[0], prev[0]),
        depth_delta_pct=calc_delta_pct(cur[1], prev[1]),
        bounce_rate_delta_pct=calc_delta_pct(cur[2], prev[2]),
        return_rate_delta_pct=calc_delta_pct(cur[3], prev[3]),
    )


async def get_engagement(
    db: AsyncSession,
    library_id: uuid.UUID,
    period: Period,
) -> EngagementData:
    date_from, date_to, prev_from, prev_to = resolve_period(period)

    async def _sum_engagement(d_from, d_to):
        q = select(
            func.coalesce(func.sum(EngagementMetric.likes), 0),
            func.coalesce(func.sum(EngagementMetric.reposts), 0),
            func.coalesce(func.sum(EngagementMetric.comments), 0),
        ).where(
            EngagementMetric.library_id == library_id,
            EngagementMetric.date >= d_from,
            EngagementMetric.date <= d_to,
        )
        row = (await db.execute(q)).one()
        return row[0], row[1], row[2]

    cur = await _sum_engagement(date_from, date_to)
    prev = await _sum_engagement(prev_from, prev_to)

    # Timeline
    q = (
        select(
            EngagementMetric.date,
            func.sum(EngagementMetric.likes),
            func.sum(EngagementMetric.reposts),
            func.sum(EngagementMetric.comments),
        )
        .where(
            EngagementMetric.library_id == library_id,
            EngagementMetric.date >= date_from,
            EngagementMetric.date <= date_to,
        )
        .group_by(EngagementMetric.date)
        .order_by(EngagementMetric.date)
    )

    rows = (await db.execute(q)).all()
    timeline = [
        EngagementPoint(date=r[0], likes=r[1], reposts=r[2], comments=r[3])
        for r in rows
    ]

    return EngagementData(
        timeline=timeline,
        total_likes=cur[0],
        total_reposts=cur[1],
        total_comments=cur[2],
        likes_delta_pct=calc_delta_pct(cur[0], prev[0]),
        reposts_delta_pct=calc_delta_pct(cur[1], prev[1]),
        comments_delta_pct=calc_delta_pct(cur[2], prev[2]),
    )


async def get_reviews(
    db: AsyncSession,
    library_id: uuid.UUID,
    limit: int = 10,
    offset: int = 0,
) -> ReviewsResponse:
    count_q = select(func.count()).select_from(Review).where(Review.library_id == library_id)
    total = (await db.execute(count_q)).scalar() or 0

    q = (
        select(Review)
        .where(Review.library_id == library_id)
        .order_by(Review.date.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = (await db.execute(q)).scalars().all()

    return ReviewsResponse(
        items=[
            ReviewItem(
                id=r.id,
                platform=r.platform,
                date=r.date,
                rating=r.rating,
                text=r.text,
                sentiment=r.sentiment,
            )
            for r in rows
        ],
        total=total,
    )
