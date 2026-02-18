from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin


class Library(Base, IdMixin, TimestampMixin):
    __tablename__ = "libraries"

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    metric_counters = relationship("MetricCounter", back_populates="library", cascade="all, delete-orphan")
    channels = relationship("Channel", back_populates="library", cascade="all, delete-orphan")
    traffic_metrics = relationship("TrafficMetric", back_populates="library", cascade="all, delete-orphan")
    engagement_metrics = relationship("EngagementMetric", back_populates="library", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="library", cascade="all, delete-orphan")
    vk_uploads = relationship("VkUpload", back_populates="library", cascade="all, delete-orphan")
    vk_metrics = relationship("VkMetric", back_populates="library", cascade="all, delete-orphan")
