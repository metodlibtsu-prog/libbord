import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin

sentiment_enum = ENUM("positive", "neutral", "negative", name="sentiment_type", create_type=False)


class Review(Base, IdMixin, TimestampMixin):
    __tablename__ = "reviews"

    library_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("libraries.id", ondelete="CASCADE"), nullable=False
    )
    platform: Mapped[str] = mapped_column(String, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    rating: Mapped[int | None] = mapped_column(SmallInteger)
    text: Mapped[str | None] = mapped_column(Text)
    sentiment: Mapped[str] = mapped_column(sentiment_enum, server_default="neutral")

    library = relationship("Library", back_populates="reviews")
