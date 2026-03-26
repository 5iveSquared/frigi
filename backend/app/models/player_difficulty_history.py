import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class PlayerDifficultyHistory(Base):
    __tablename__ = "player_difficulty_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    player_id: Mapped[str] = mapped_column(String, ForeignKey("players.id"), nullable=False)
    session_id: Mapped[str] = mapped_column(String, ForeignKey("game_sessions.id"), nullable=False)
    difficulty_in: Mapped[float] = mapped_column(Float, nullable=False)
    performance_pct: Mapped[float] = mapped_column(Float, nullable=False)
    new_elo: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
