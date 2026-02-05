import uuid
from datetime import datetime

from pydantic import BaseModel


class LibraryCreate(BaseModel):
    name: str
    description: str | None = None


class LibraryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class LibraryOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
