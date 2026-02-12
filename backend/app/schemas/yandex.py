from __future__ import annotations

import uuid
from pydantic import BaseModel

from app.models.channel import ChannelType


class OAuthStartResponse(BaseModel):
    """Response with authorization URL for OAuth flow"""

    auth_url: str


class YandexCounterOut(BaseModel):
    """Yandex.Metrika counter information"""

    id: int
    name: str
    status: str | None = None


class LinkCounterRequest(BaseModel):
    """Request to link a Yandex.Metrika counter to library"""

    library_id: uuid.UUID
    yandex_counter_id: str
    name: str
    channel_type: ChannelType
    custom_name: str | None = None
