import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin


class TrafficMetric(Base, IdMixin, TimestampMixin):
    __tablename__ = "traffic_metrics"
    __table_args__ = (
        UniqueConstraint("library_id", "channel_id", "counter_id", "date", name="uq_traffic_metric"),
    )

    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("libraries.id", ondelete="CASCADE"), nullable=False
    )
    channel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("channels.id", ondelete="CASCADE"), nullable=False
    )
    counter_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("metric_counters.id", ondelete="SET NULL")
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    views: Mapped[int] = mapped_column(Integer, default=0)
    visits: Mapped[int] = mapped_column(Integer, default=0)
    users: Mapped[int] = mapped_column(Integer, default=0)
    avg_time: Mapped[float] = mapped_column(Float, default=0)
    depth: Mapped[float] = mapped_column(Float, default=0)
    bounce_rate: Mapped[float] = mapped_column(Float, default=0)
    return_rate: Mapped[float] = mapped_column(Float, default=0)

    library = relationship("Library", back_populates="traffic_metrics")
    channel = relationship("Channel", back_populates="traffic_metrics")
