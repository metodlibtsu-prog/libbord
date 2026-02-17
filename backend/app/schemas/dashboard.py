from __future__ import annotations

import datetime
import uuid
from enum import Enum

from pydantic import BaseModel


class Period(str, Enum):
    today = "today"
    yesterday = "yesterday"
    week = "week"
    month = "month"
    quarter = "quarter"
    year = "year"


# Block 1: KPI overview
class KpiOverview(BaseModel):
    views: int
    visits: int
    users: int
    active_users: int
    views_delta_pct: float | None
    visits_delta_pct: float | None
    users_delta_pct: float | None
    active_users_delta_pct: float | None


# Block 2: Channels
class ChannelMetric(BaseModel):
    channel_id: uuid.UUID
    channel_type: str
    custom_name: str | None
    views: int
    visits: int
    users: int


class ChannelTrendPoint(BaseModel):
    date: datetime.date
    views: int
    visits: int
    users: int


# Block 3: Behavior
class BehaviorPoint(BaseModel):
    date: datetime.date
    avg_time: float
    depth: float
    bounce_rate: float
    return_rate: float


class CounterBehaviorTimeline(BaseModel):
    counter_id: uuid.UUID
    counter_name: str
    timeline: list[BehaviorPoint]
    current_avg_time: float
    current_depth: float
    current_bounce_rate: float
    current_return_rate: float


class BehaviorData(BaseModel):
    counters: list[CounterBehaviorTimeline]
    avg_time_delta_pct: float | None
    depth_delta_pct: float | None
    bounce_rate_delta_pct: float | None
    return_rate_delta_pct: float | None


# Block 4: Engagement
class EngagementPoint(BaseModel):
    date: datetime.date
    likes: int
    reposts: int
    comments: int


class EngagementData(BaseModel):
    timeline: list[EngagementPoint]
    total_likes: int
    total_reposts: int
    total_comments: int
    likes_delta_pct: float | None
    reposts_delta_pct: float | None
    comments_delta_pct: float | None


# Reviews list
class ReviewItem(BaseModel):
    id: uuid.UUID
    platform: str
    date: datetime.date
    rating: int | None
    text: str | None
    sentiment: str


class ReviewsResponse(BaseModel):
    items: list[ReviewItem]
    total: int
