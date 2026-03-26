import logging
import math
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.level import Level
from app.models.player import Player
from app.models.player_difficulty_history import PlayerDifficultyHistory
from app.models.player_level_progress import PlayerLevelProgress
from app.models.session import GameSession
from app.models.score import Score
from app.schemas.session import SessionComplete
from app.services.difficulty_engine import DifficultyEngine

logger = logging.getLogger(__name__)


class ScoringService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.difficulty_engine = DifficultyEngine()

    async def complete_session(
        self,
        session_id: str,
        player_id: str,
        body: SessionComplete,
    ) -> GameSession | None:
        logger.info(
            "scoring.complete.start session_id=%s player_id=%s duration_ms=%s move_count=%s",
            session_id,
            player_id,
            body.duration_ms,
            body.move_count,
        )
        result = await self.db.execute(
            select(GameSession).where(
                GameSession.id == session_id,
                GameSession.player_id == player_id,
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            logger.warning(
                "scoring.complete.session_missing session_id=%s player_id=%s",
                session_id,
                player_id,
            )
            return None
        if session.status == "completed":
            logger.info(
                "scoring.complete.already_completed session_id=%s player_id=%s",
                session_id,
                player_id,
            )
            return session

        player_result = await self.db.execute(
            select(Player).where(Player.id == player_id)
        )
        player = player_result.scalar_one_or_none()
        if not player:
            logger.warning(
                "scoring.complete.player_missing session_id=%s player_id=%s",
                session_id,
                player_id,
            )
            return None

        level_result = await self.db.execute(
            select(Level).where(Level.id == session.level_id)
        )
        level = level_result.scalar_one_or_none()
        if not level:
            logger.warning(
                "scoring.complete.level_missing session_id=%s player_id=%s level_id=%s",
                session_id,
                player_id,
                session.level_id,
            )
            return None

        session.status = "completed"
        session.duration_ms = body.duration_ms
        session.move_count = body.move_count
        session.final_placement = body.final_placement
        session.completed_at = datetime.now(timezone.utc)

        placement = body.final_placement
        elapsed_seconds = body.duration_ms / 1000
        move_count = session.move_count

        efficiency_score, efficiency_pct = self._calc_efficiency(placement)
        time_score = math.floor(500 * math.exp(-0.005 * elapsed_seconds))
        move_score = max(0, 200 - move_count * 2)
        total_score = efficiency_score + time_score + move_score
        new_elo, performance_pct = self.difficulty_engine.update_elo(
            player.elo_rating,
            total_score,
            level.optimal_score,
        )
        logger.info(
            "scoring.complete.calculated session_id=%s level_id=%s total_score=%s efficiency_score=%s time_score=%s move_score=%s efficiency_pct=%.4f old_elo=%.2f new_elo=%.2f",
            session_id,
            level.id,
            total_score,
            efficiency_score,
            time_score,
            move_score,
            efficiency_pct,
            player.elo_rating,
            new_elo,
        )
        player.elo_rating = new_elo
        player.total_games += 1

        score = Score(
            id=str(uuid.uuid4()),
            session_id=session_id,
            player_id=player_id,
            level_id=session.level_id,
            total_score=total_score,
            efficiency_score=efficiency_score,
            time_score=time_score,
            constraint_score=0,
            move_score=move_score,
            efficiency_pct=efficiency_pct,
        )
        self.db.add(score)
        self.db.add(
            PlayerDifficultyHistory(
                id=str(uuid.uuid4()),
                player_id=player_id,
                session_id=session_id,
                difficulty_in=level.difficulty,
                performance_pct=performance_pct,
                new_elo=new_elo,
            )
        )
        await self._update_level_progress(
            player_id=player_id,
            level=level,
            total_score=total_score,
            duration_ms=body.duration_ms,
            efficiency_pct=efficiency_pct,
            completed_at=session.completed_at,
        )
        await self.db.flush()
        logger.info(
            "scoring.complete.persisted session_id=%s player_id=%s level_id=%s score_id=%s total_games=%s",
            session_id,
            player_id,
            level.id,
            score.id,
            player.total_games,
        )
        return session

    def _calc_efficiency(self, placement: dict) -> tuple[int, float]:
        placed_items = placement.get("placedItems", [])
        occupied = sum(
            sum(cell for row in item.get("rotatedShape", []) for cell in row)
            for item in placed_items
        )
        grid_area = placement.get("gridArea", 20)
        fill_ratio = occupied / grid_area if grid_area > 0 else 0
        return math.floor(fill_ratio * grid_area * 100), fill_ratio

    async def _update_level_progress(
        self,
        player_id: str,
        level: Level,
        total_score: int,
        duration_ms: int,
        efficiency_pct: float,
        completed_at: datetime,
    ) -> None:
        if level.progression_index <= 0:
            return

        result = await self.db.execute(
            select(PlayerLevelProgress).where(
                PlayerLevelProgress.player_id == player_id,
                PlayerLevelProgress.level_number == level.progression_index,
            )
        )
        progress = result.scalar_one_or_none()

        stars = 3 if efficiency_pct >= 0.85 else 2 if efficiency_pct >= 0.65 else 1
        if progress is None:
            progress = PlayerLevelProgress(
                id=str(uuid.uuid4()),
                player_id=player_id,
                level_number=level.progression_index,
                attempts=1,
                completions=1,
                best_score=total_score,
                best_duration_ms=duration_ms,
                best_efficiency_pct=efficiency_pct,
                stars=stars,
                first_completed_at=completed_at,
                last_completed_at=completed_at,
            )
            self.db.add(progress)
            return

        progress.completions += 1
        progress.best_score = max(progress.best_score or 0, total_score)
        progress.best_duration_ms = (
            duration_ms
            if progress.best_duration_ms is None
            else min(progress.best_duration_ms, duration_ms)
        )
        progress.best_efficiency_pct = max(progress.best_efficiency_pct or 0.0, efficiency_pct)
        progress.stars = max(progress.stars, stars)
        if progress.first_completed_at is None:
            progress.first_completed_at = completed_at
        progress.last_completed_at = completed_at
