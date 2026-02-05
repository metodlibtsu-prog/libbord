import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin

sync_status_enum = ENUM("idle", "syncing", "success", "error", name="sync_status_type", create_type=False)


class MetricCounter(Base, IdMixin, TimestampMixin):
    __tablename__ = "metric_counters"

    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("libraries.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    yandex_counter_id: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_sync_at: Mapped[datetime | None] = mapped_column()
    sync_status: Mapped[str] = mapped_column(sync_status_enum, server_default="idle")
    sync_error_message: Mapped[str | None] = mapped_column(Text)

    library = relationship("Library", back_populates="metric_counters")
