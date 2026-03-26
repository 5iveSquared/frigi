from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_player
from app.schemas.player import (
    PlayerCreate,
    PlayerLogin,
    PlayerProgressSummaryResponse,
    PlayerResponse,
    TokenResponse,
)
from app.services.player_service import PlayerService

router = APIRouter()


@router.post("/register", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED)
async def register(body: PlayerCreate, db: AsyncSession = Depends(get_db)):
    service = PlayerService(db)
    return await service.create_player(body)


@router.post("/login", response_model=TokenResponse)
async def login(body: PlayerLogin, db: AsyncSession = Depends(get_db)):
    service = PlayerService(db)
    return await service.authenticate(body.email, body.password)


@router.get("/me", response_model=PlayerResponse)
async def me(
    player_id: str = Depends(get_current_player),
    db: AsyncSession = Depends(get_db),
):
    service = PlayerService(db)
    player = await service.get_player(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.get("/me/progress", response_model=PlayerProgressSummaryResponse)
async def my_progress(
    player_id: str = Depends(get_current_player),
    db: AsyncSession = Depends(get_db),
):
    service = PlayerService(db)
    return await service.get_progress_summary(player_id)
