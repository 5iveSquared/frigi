import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_player
from app.models.level import Level
from app.models.player_level_progress import PlayerLevelProgress
from app.models.session import GameSession
from app.schemas.session import SessionCreate, SessionComplete, SessionResponse
from app.services.scoring_service import ScoringService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    player_id: str = Depends(get_current_player),
    db: AsyncSession = Depends(get_db),
):
    import uuid
    from datetime import datetime, timezone

    logger.info(
        "session.create.start player_id=%s level_id=%s",
        player_id,
        body.level_id,
    )

    existing_sessions = await db.execute(
        select(GameSession).where(
            GameSession.player_id == player_id,
            GameSession.status.in_(("pending", "active")),
        )
    )
    for existing in existing_sessions.scalars():
        existing.status = "abandoned"
        existing.completed_at = datetime.now(timezone.utc)

    level_result = await db.execute(select(Level).where(Level.id == body.level_id))
    level = level_result.scalar_one_or_none()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    if not level.is_daily and level.progression_index > 0:
        progress_result = await db.execute(
            select(PlayerLevelProgress).where(
                PlayerLevelProgress.player_id == player_id,
                PlayerLevelProgress.level_number == level.progression_index,
            )
        )
        progress = progress_result.scalar_one_or_none()
        if progress is None:
            progress = PlayerLevelProgress(
                player_id=player_id,
                level_number=level.progression_index,
                attempts=1,
                completions=0,
                stars=0,
            )
            db.add(progress)
        else:
            progress.attempts += 1

    session = GameSession(
        id=str(uuid.uuid4()),
        player_id=player_id,
        level_id=body.level_id,
        status="active",
    )
    db.add(session)
    await db.flush()
    logger.info(
        "session.create.success session_id=%s player_id=%s level_id=%s progression_index=%s",
        session.id,
        player_id,
        body.level_id,
        level.progression_index,
    )
    return session


@router.patch("/{session_id}/complete", response_model=SessionResponse)
async def complete_session(
    session_id: str,
    body: SessionComplete,
    player_id: str = Depends(get_current_player),
    db: AsyncSession = Depends(get_db),
):
    logger.info(
        "session.complete.request session_id=%s player_id=%s duration_ms=%s move_count=%s placed_items=%s",
        session_id,
        player_id,
        body.duration_ms,
        body.move_count,
        len(body.final_placement.get("placedItems", [])),
    )
    service = ScoringService(db)
    session = await service.complete_session(session_id, player_id, body)
    if not session:
        logger.warning(
            "session.complete.not_found session_id=%s player_id=%s",
            session_id,
            player_id,
        )
        raise HTTPException(status_code=404, detail="Session not found")
    logger.info(
        "session.complete.success session_id=%s player_id=%s status=%s duration_ms=%s move_count=%s",
        session.id,
        player_id,
        session.status,
        session.duration_ms,
        session.move_count,
    )
    return session
