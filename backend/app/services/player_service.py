import uuid
from datetime import date, datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.level import Level
from app.models.player import Player
from app.models.player_level_progress import PlayerLevelProgress
from app.models.score import Score
from app.models.session import GameSession
from app.schemas.player import (
    DailyProgressResponse,
    PlayerCreate,
    PlayerLevelProgressResponse,
    PlayerProgressSummaryResponse,
    PlayerResponse,
    TokenResponse,
)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class PlayerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_player(self, body: PlayerCreate) -> Player:
        player = Player(
            id=str(uuid.uuid4()),
            username=body.username,
            email=body.email,
            hashed_password=pwd_context.hash(body.password),
        )
        self.db.add(player)
        await self.db.flush()
        return player

    async def authenticate(self, email: str, password: str) -> TokenResponse:
        result = await self.db.execute(select(Player).where(Player.email == email))
        player = result.scalar_one_or_none()
        if not player or not pwd_context.verify(password, player.hashed_password):
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
        token = jwt.encode({"sub": player.id, "exp": expire}, settings.secret_key, algorithm="HS256")
        return TokenResponse(access_token=token)

    async def get_player(self, player_id: str) -> Player | None:
        result = await self.db.execute(select(Player).where(Player.id == player_id))
        return result.scalar_one_or_none()

    async def get_progress_summary(self, player_id: str) -> PlayerProgressSummaryResponse:
        result = await self.db.execute(
            select(PlayerLevelProgress)
            .where(PlayerLevelProgress.player_id == player_id)
            .order_by(PlayerLevelProgress.level_number.asc())
        )
        rows = result.scalars().all()
        completed_levels = sum(1 for row in rows if row.completions > 0)
        total_stars = sum(row.stars for row in rows)
        daily = await self._get_daily_summary(player_id)

        return PlayerProgressSummaryResponse(
            completed_levels=completed_levels,
            current_level_number=max(1, completed_levels + 1),
            total_stars=total_stars,
            levels=[
                PlayerLevelProgressResponse(
                    level_number=row.level_number,
                    attempts=row.attempts,
                    completions=row.completions,
                    best_score=row.best_score,
                    best_duration_ms=row.best_duration_ms,
                    best_efficiency_pct=row.best_efficiency_pct,
                    stars=row.stars,
                    first_completed_at=row.first_completed_at.isoformat() if row.first_completed_at else None,
                    last_completed_at=row.last_completed_at.isoformat() if row.last_completed_at else None,
                )
                for row in rows
            ],
            daily=daily,
        )

    async def _get_daily_summary(self, player_id: str) -> DailyProgressResponse | None:
        today = date.today()
        daily_result = await self.db.execute(
            select(Level).where(Level.is_daily == True, Level.daily_date == today)
        )
        daily_level = daily_result.scalar_one_or_none()
        if not daily_level:
            return None

        attempts_result = await self.db.execute(
            select(func.count(GameSession.id)).where(
                GameSession.player_id == player_id,
                GameSession.level_id == daily_level.id,
            )
        )
        attempts = attempts_result.scalar_one() or 0

        completed_result = await self.db.execute(
            select(GameSession)
            .where(
                GameSession.player_id == player_id,
                GameSession.level_id == daily_level.id,
                GameSession.status == "completed",
            )
            .order_by(GameSession.completed_at.desc())
            .limit(1)
        )
        completed_session = completed_result.scalar_one_or_none()

        best_score_result = await self.db.execute(
            select(func.max(Score.total_score)).where(
                Score.player_id == player_id,
                Score.level_id == daily_level.id,
            )
        )
        best_score = best_score_result.scalar_one()

        return DailyProgressResponse(
            level_id=daily_level.id,
            daily_date=daily_level.daily_date.isoformat() if daily_level.daily_date else None,
            has_attempt=attempts > 0,
            is_completed=completed_session is not None,
            attempts=attempts,
            best_score=best_score,
            completed_at=completed_session.completed_at.isoformat()
            if completed_session and completed_session.completed_at
            else None,
        )
