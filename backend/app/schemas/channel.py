import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class ChannelType(str, Enum):
    website = "website"
    e_library = "e_library"
    catalog = "catalog"
    telegram = "telegram"
    vk = "vk"
    mobile_app = "mobile_app"
    other = "other"


class ChannelCreate(BaseModel):
    library_id: uuid.UUID
    type: ChannelType
    custom_name: str | None = None
    is_manual: bool = False


class ChannelUpdate(BaseModel):
    type: ChannelType | None = None
    custom_name: str | None = None
    is_manual: bool | None = None


class ChannelOut(BaseModel):
    id: uuid.UUID
    library_id: uuid.UUID
    type: ChannelType
    custom_name: str | None
    is_manual: bool
    created_at: datetime

    model_config = {"from_attributes": True}
