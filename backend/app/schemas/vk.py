from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel


class VkUploadOut(BaseModel):
    """VK Upload response"""

    id: uuid.UUID
    library_id: uuid.UUID
    channel_id: uuid.UUID
    filename: str
    uploaded_at: datetime.datetime
    period_start: datetime.date
    period_end: datetime.date
    total_rows: int | None
    status: str
    error_message: str | None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class VkMetricOut(BaseModel):
    """VK Metric response"""

    id: uuid.UUID
    library_id: uuid.UUID
    channel_id: uuid.UUID
    upload_id: uuid.UUID | None
    date: datetime.date
    visitors: int
    views: int
    posts: int
    stories: int
    clips: int
    videos: int
    subscribed: int
    unsubscribed: int
    total_subscribers: int
    site_clicks: int
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class VkKpi(BaseModel):
    """VK KPI summary"""

    reach: int
    views: int
    subscribers: int
    er_pct: float
    reposts: int
    comments: int
    reach_delta_pct: float | None
    views_delta_pct: float | None
    subscribers_delta_pct: float | None
    er_delta_pct: float | None


class VkReachPoint(BaseModel):
    """Reach trend data point"""

    date: str
    reach: int
    views: int


class VkEngagementPoint(BaseModel):
    """Engagement trend data point"""

    date: str
    likes: int
    reposts: int
    comments: int
    er: float


class VkContentPoint(BaseModel):
    """Content activity trend data point"""

    date: str
    posts: int
    stories: int
    clips: int
    videos: int


class VkTopPost(BaseModel):
    """Top post by engagement"""

    date: str
    type: str
    reach: int
    er: float
    likes: int
    comments: int


class VkPeriodInfo(BaseModel):
    """Period metadata"""

    start: str
    end: str
    upload_date: str | None


class VkStatsResponse(BaseModel):
    """Full VK statistics response"""

    kpis: VkKpi
    reach_trend: list[VkReachPoint]
    engagement_trend: list[VkEngagementPoint]
    content_trend: list[VkContentPoint]
    top_posts: list[VkTopPost]
    period_info: VkPeriodInfo
    insights: list[dict]  # Re-use existing Insight schema


class VkUploadSummary(BaseModel):
    """Upload summary response"""

    upload_id: uuid.UUID
    total_rows: int
    period_start: datetime.date
    period_end: datetime.date
    vk_metrics_count: int
    engagement_metrics_count: int
