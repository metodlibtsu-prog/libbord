from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel


class EngagementMetricCreate(BaseModel):
    library_id: uuid.UUID
    channel_id: uuid.UUID
    date: datetime.date
    likes: int = 0
    reposts: int = 0
    comments: int = 0
    notes: str | None = None


class EngagementMetricUpdate(BaseModel):
    likes: int | None = None
    reposts: int | None = None
    comments: int | None = None
    notes: str | None = None


class EngagementMetricOut(BaseModel):
    id: uuid.UUID
    library_id: uuid.UUID
    channel_id: uuid.UUID
    date: datetime.date
    likes: int
    reposts: int
    comments: int
    notes: str | None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
