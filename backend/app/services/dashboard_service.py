import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.channel import Channel
from app.models.engagement_metric import EngagementMetric
from app.models.metric_counter import MetricCounter
from app.models.review import Review
from app.models.traffic_metric import TrafficMetric
from app.schemas.dashboard import (
    BehaviorData,
    BehaviorPoint,
    ChannelMetric,
    ChannelTrendPoint,
    CounterBehaviorTimeline,
    EngagementData,
    EngagementPoint,
    KpiOverview,
    Period,
    ReviewItem,
    ReviewsResponse,
)
from app.services.period import calc_delta_pct, resolve_period, resolve_period_or_custom


async def get_overview(
    db: AsyncSession,
    library_id: uuid.UUID,
    period: Period,
    counter_id: uuid.UUID | None = None,
    date_from_custom: date | None = None,
    date_to_custom: date | None = None,
) -> KpiOverview:
    date_from, date_to, prev_from, prev_to = resolve_period_or_custom(period, date_from_custom, date_to_custom)

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
    date_from_custom: date | None = None,
    date_to_custom: date | None = None,
) -> list[ChannelMetric]:
    date_from, date_to, _, _ = resolve_period_or_custom(period, date_from_custom, date_to_custom)

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
    date_from_custom: date | None = None,
    date_to_custom: date | None = None,
) -> list[ChannelTrendPoint]:
    date_from, date_to, _, _ = resolve_period_or_custom(period, date_from_custom, date_to_custom)

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
    date_from_custom: date | None = None,
    date_to_custom: date | None = None,
) -> BehaviorData:
    date_from, date_to, prev_from, prev_to = resolve_period_or_custom(period, date_from_custom, date_to_custom)

    # Get all active counters for this library
    counters_q = select(MetricCounter).where(
        MetricCounter.library_id == library_id,
        MetricCounter.is_active == True,
    )
    if counter_id:
        counters_q = counters_q.where(MetricCounter.id == counter_id)

    counters = (await db.execute(counters_q)).scalars().all()

    # For overall delta calculation (all counters combined)
    async def _avg_behavior_all(d_from, d_to):
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

    cur_all = await _avg_behavior_all(date_from, date_to)
    prev_all = await _avg_behavior_all(prev_from, prev_to)

    # Build timeline for each counter
    counter_timelines = []
    for counter in counters:
        # Get timeline data
        timeline_q = (
            select(
                TrafficMetric.date,
                func.avg(TrafficMetric.avg_time),
                func.avg(TrafficMetric.depth),
                func.avg(TrafficMetric.bounce_rate),
                func.avg(TrafficMetric.return_rate),
            )
            .where(
                TrafficMetric.library_id == library_id,
                TrafficMetric.counter_id == counter.id,
                TrafficMetric.date >= date_from,
                TrafficMetric.date <= date_to,
            )
            .group_by(TrafficMetric.date)
            .order_by(TrafficMetric.date)
        )
        rows = (await db.execute(timeline_q)).all()

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

        # Get current period averages for this counter
        current_q = select(
            func.coalesce(func.avg(TrafficMetric.avg_time), 0),
            func.coalesce(func.avg(TrafficMetric.depth), 0),
            func.coalesce(func.avg(TrafficMetric.bounce_rate), 0),
            func.coalesce(func.avg(TrafficMetric.return_rate), 0),
        ).where(
            TrafficMetric.library_id == library_id,
            TrafficMetric.counter_id == counter.id,
            TrafficMetric.date >= date_from,
            TrafficMetric.date <= date_to,
        )
        current_row = (await db.execute(current_q)).one()

        counter_timelines.append(
            CounterBehaviorTimeline(
                counter_id=counter.id,
                counter_name=counter.name,
                timeline=timeline,
                current_avg_time=round(current_row[0], 1),
                current_depth=round(current_row[1], 2),
                current_bounce_rate=round(current_row[2], 1),
                current_return_rate=round(current_row[3], 1),
            )
        )

    return BehaviorData(
        counters=counter_timelines,
        avg_time_delta_pct=calc_delta_pct(cur_all[0], prev_all[0]),
        depth_delta_pct=calc_delta_pct(cur_all[1], prev_all[1]),
        bounce_rate_delta_pct=calc_delta_pct(cur_all[2], prev_all[2]),
        return_rate_delta_pct=calc_delta_pct(cur_all[3], prev_all[3]),
    )


async def get_engagement(
    db: AsyncSession,
    library_id: uuid.UUID,
    period: Period,
    date_from_custom: date | None = None,
    date_to_custom: date | None = None,
) -> EngagementData:
    date_from, date_to, prev_from, prev_to = resolve_period_or_custom(period, date_from_custom, date_to_custom)

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
