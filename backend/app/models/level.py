import uuid
from datetime import datetime

from sqlalchemy import String, Float, Integer, Boolean, DateTime, Date
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class Level(Base):
    __tablename__ = "levels"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    grid_config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    items: Mapped[list] = mapped_column(JSONB, nullable=False)
    constraints: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    theme: Mapped[str] = mapped_column(String(64), nullable=False)
    difficulty: Mapped[float] = mapped_column(Float, nullable=False)
    progression_index: Mapped[int] = mapped_column(Integer, default=0)
    optimal_score: Mapped[int] = mapped_column(Integer, default=0)
    is_daily: Mapped[bool] = mapped_column(Boolean, default=False)
    daily_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    @property
    def grid(self) -> dict:
        return self.grid_config
