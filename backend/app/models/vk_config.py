import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin


class VkConfig(Base, IdMixin, TimestampMixin):
    """VK community API configuration per library"""

    __tablename__ = "vk_configs"

    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("libraries.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )
    community_token: Mapped[str] = mapped_column(Text, nullable=False)
    community_id: Mapped[str | None] = mapped_column(String(32))
    community_name: Mapped[str | None] = mapped_column(String(255))
    last_sync_at: Mapped[datetime | None] = mapped_column()
    sync_status: Mapped[str] = mapped_column(String(16), server_default="idle")
    sync_error: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    library = relationship("Library", back_populates="vk_config")
