from __future__ import annotations

import datetime
import uuid
from enum import Enum

from pydantic import BaseModel, Field


class Sentiment(str, Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class ReviewCreate(BaseModel):
    library_id: uuid.UUID
    platform: str
    date: datetime.date
    rating: int | None = Field(None, ge=1, le=5)
    text: str | None = None
    sentiment: Sentiment = Sentiment.neutral


class ReviewUpdate(BaseModel):
    platform: str | None = None
    date: datetime.date | None = None
    rating: int | None = Field(None, ge=1, le=5)
    text: str | None = None
    sentiment: Sentiment | None = None


class ReviewOut(BaseModel):
    id: uuid.UUID
    library_id: uuid.UUID
    platform: str
    date: datetime.date
    rating: int | None
    text: str | None
    sentiment: Sentiment
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
