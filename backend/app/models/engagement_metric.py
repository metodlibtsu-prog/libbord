import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin


class EngagementMetric(Base, IdMixin, TimestampMixin):
    __tablename__ = "engagement_metrics"
    __table_args__ = (
        UniqueConstraint("library_id", "channel_id", "date", name="uq_engagement_metric"),
    )

    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("libraries.id", ondelete="CASCADE"), nullable=False
    )
    channel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("channels.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    reposts: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text)

    library = relationship("Library", back_populates="engagement_metrics")
    channel = relationship("Channel", back_populates="engagement_metrics")
