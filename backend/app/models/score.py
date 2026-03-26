import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class Score(Base):
    __tablename__ = "scores"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String, ForeignKey("game_sessions.id"), nullable=False)
    player_id: Mapped[str] = mapped_column(String, ForeignKey("players.id"), nullable=False)
    level_id: Mapped[str] = mapped_column(String, ForeignKey("levels.id"), nullable=False)
    total_score: Mapped[int] = mapped_column(Integer, default=0)
    efficiency_score: Mapped[int] = mapped_column(Integer, default=0)
    time_score: Mapped[int] = mapped_column(Integer, default=0)
    constraint_score: Mapped[int] = mapped_column(Integer, default=0)
    move_score: Mapped[int] = mapped_column(Integer, default=0)
    efficiency_pct: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
