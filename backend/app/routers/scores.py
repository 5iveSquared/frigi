from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.score import LeaderboardEntry
from app.services.level_generator import LevelGeneratorService

router = APIRouter()


def _materialize_leaderboard(rows: list, limit: int) -> list[LeaderboardEntry]:
    seen_players: set[str] = set()
    entries: list[LeaderboardEntry] = []
    for row in rows:
        score = row.Score
        if score.player_id in seen_players:
            continue
        seen_players.add(score.player_id)
        entries.append(
            LeaderboardEntry(
                rank=len(entries) + 1,
                player_id=score.player_id,
                username=row.username,
                total_score=score.total_score,
                efficiency_pct=score.efficiency_pct,
                duration_ms=row.duration_ms or 0,
                created_at=score.created_at.isoformat(),
            )
        )
        if len(entries) >= limit:
            break
    return entries


@router.get("/leaderboard/daily", response_model=list[LeaderboardEntry])
async def get_daily_leaderboard(limit: int = 10, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import desc, select
    from app.models.score import Score
    from app.models.player import Player
    from app.models.session import GameSession
    from app.models.level import Level

    service = LevelGeneratorService(db)
    daily = await service.get_daily()
    result = await db.execute(
        select(Score, Player.username, GameSession.duration_ms)
        .join(Player, Score.player_id == Player.id)
        .join(GameSession, Score.session_id == GameSession.id)
        .join(Level, Score.level_id == Level.id)
        .where(Score.level_id == daily.id, Level.is_daily == True)
        .order_by(desc(Score.total_score), GameSession.duration_ms.asc(), Score.created_at.asc())
        .limit(max(limit * 5, 25))
    )
    return _materialize_leaderboard(result.all(), limit)


@router.get("/leaderboard/progression/{level_number}", response_model=list[LeaderboardEntry])
async def get_progression_leaderboard(level_number: int, limit: int = 10, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import desc, select
    from app.models.score import Score
    from app.models.player import Player
    from app.models.session import GameSession
    from app.models.level import Level

    result = await db.execute(
        select(Score, Player.username, GameSession.duration_ms)
        .join(Player, Score.player_id == Player.id)
        .join(GameSession, Score.session_id == GameSession.id)
        .join(Level, Score.level_id == Level.id)
        .where(Level.progression_index == level_number, Level.is_daily == False)
        .order_by(desc(Score.total_score), GameSession.duration_ms.asc(), Score.created_at.asc())
        .limit(max(limit * 5, 25))
    )
    return _materialize_leaderboard(result.all(), limit)


@router.get("/leaderboard/{level_id}", response_model=list[LeaderboardEntry])
async def get_leaderboard(level_id: str, limit: int = 10, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, desc
    from app.models.score import Score
    from app.models.player import Player
    from app.models.session import GameSession

    result = await db.execute(
        select(Score, Player.username, GameSession.duration_ms)
        .join(Player, Score.player_id == Player.id)
        .join(GameSession, Score.session_id == GameSession.id)
        .where(Score.level_id == level_id)
        .order_by(desc(Score.total_score), GameSession.duration_ms.asc(), Score.created_at.asc())
        .limit(max(limit * 5, 25))
    )
    return _materialize_leaderboard(result.all(), limit)
