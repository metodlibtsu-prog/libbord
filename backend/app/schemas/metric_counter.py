import uuid
from datetime import datetime

from pydantic import BaseModel


class MetricCounterCreate(BaseModel):
    library_id: uuid.UUID
    name: str
    yandex_counter_id: str
    is_active: bool = True


class MetricCounterUpdate(BaseModel):
    name: str | None = None
    yandex_counter_id: str | None = None
    is_active: bool | None = None


class MetricCounterOut(BaseModel):
    id: uuid.UUID
    library_id: uuid.UUID
    name: str
    yandex_counter_id: str
    is_active: bool
    last_sync_at: datetime | None
    sync_status: str
    sync_error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
