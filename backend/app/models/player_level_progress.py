import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class PlayerLevelProgress(Base):
    __tablename__ = "player_level_progress"
    __table_args__ = (
        UniqueConstraint("player_id", "level_number", name="uq_player_level_progress_player_level"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    player_id: Mapped[str] = mapped_column(String, ForeignKey("players.id"), nullable=False)
    level_number: Mapped[int] = mapped_column(Integer, nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    completions: Mapped[int] = mapped_column(Integer, default=0)
    best_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    best_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    best_efficiency_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    stars: Mapped[int] = mapped_column(Integer, default=0)
    first_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
