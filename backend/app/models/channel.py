import uuid
from enum import Enum

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin


class ChannelType(str, Enum):
    """Типы цифровых каналов библиотеки"""
    WEBSITE = "website"
    E_LIBRARY = "e_library"
    CATALOG = "catalog"
    TELEGRAM = "telegram"
    VK = "vk"
    MOBILE_APP = "mobile_app"
    OTHER = "other"


channel_type_enum = ENUM(
    "website", "e_library", "catalog", "telegram", "vk", "mobile_app", "other",
    name="channel_type",
    create_type=False,
)


class Channel(Base, IdMixin, TimestampMixin):
    __tablename__ = "channels"

    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("libraries.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(channel_type_enum, nullable=False)
    custom_name: Mapped[str | None] = mapped_column(String)
    is_manual: Mapped[bool] = mapped_column(Boolean, default=False)

    library = relationship("Library", back_populates="channels")
    traffic_metrics = relationship("TrafficMetric", back_populates="channel", cascade="all, delete-orphan")
    engagement_metrics = relationship("EngagementMetric", back_populates="channel", cascade="all, delete-orphan")
    vk_uploads = relationship("VkUpload", back_populates="channel", cascade="all, delete-orphan")
    vk_metrics = relationship("VkMetric", back_populates="channel", cascade="all, delete-orphan")
