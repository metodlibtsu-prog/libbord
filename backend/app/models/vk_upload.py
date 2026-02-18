import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin


class VkUpload(Base, IdMixin, TimestampMixin):
    """VK CSV upload tracking"""

    __tablename__ = "vk_uploads"

    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("libraries.id", ondelete="CASCADE"), nullable=False
    )
    channel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("channels.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    total_rows: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String, server_default="processing")
    error_message: Mapped[str | None] = mapped_column(Text)

    # Relationships
    library = relationship("Library", back_populates="vk_uploads")
    channel = relationship("Channel", back_populates="vk_uploads")
    vk_metrics = relationship("VkMetric", back_populates="upload", cascade="all, delete-orphan")
