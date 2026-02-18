import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin


class VkMetric(Base, IdMixin, TimestampMixin):
    """VK-specific metrics (reach, views, posts, subscribers)"""

    __tablename__ = "vk_metrics"
    __table_args__ = (UniqueConstraint("library_id", "channel_id", "date"),)

    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("libraries.id", ondelete="CASCADE"), nullable=False
    )
    channel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("channels.id", ondelete="CASCADE"), nullable=False
    )
    upload_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vk_uploads.id", ondelete="CASCADE")
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)

    # Reach and views
    visitors: Mapped[int] = mapped_column(Integer, server_default="0")
    views: Mapped[int] = mapped_column(Integer, server_default="0")

    # Content
    posts: Mapped[int] = mapped_column(Integer, server_default="0")
    stories: Mapped[int] = mapped_column(Integer, server_default="0")
    clips: Mapped[int] = mapped_column(Integer, server_default="0")
    videos: Mapped[int] = mapped_column(Integer, server_default="0")

    # Subscribers dynamics
    subscribed: Mapped[int] = mapped_column(Integer, server_default="0")
    unsubscribed: Mapped[int] = mapped_column(Integer, server_default="0")
    total_subscribers: Mapped[int] = mapped_column(Integer, server_default="0")

    # Site clicks
    site_clicks: Mapped[int] = mapped_column(Integer, server_default="0")

    # Relationships
    library = relationship("Library", back_populates="vk_metrics")
    channel = relationship("Channel", back_populates="vk_metrics")
    upload = relationship("VkUpload", back_populates="vk_metrics")
