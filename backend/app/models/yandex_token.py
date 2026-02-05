import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IdMixin, TimestampMixin


class YandexToken(Base, IdMixin, TimestampMixin):
    __tablename__ = "yandex_tokens"

    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("libraries.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(Text)
    expires_at: Mapped[datetime | None] = mapped_column()
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
