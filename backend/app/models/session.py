import uuid
from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, utcnow


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    player_id: Mapped[str] = mapped_column(String, ForeignKey("players.id"), nullable=False)
    level_id: Mapped[str] = mapped_column(String, ForeignKey("levels.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    move_count: Mapped[int] = mapped_column(Integer, default=0)
    final_placement: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
