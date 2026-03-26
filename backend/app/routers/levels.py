from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_player, get_db
from app.schemas.level import LevelGenerateRequest, LevelResponse
from app.content.global_level import GLOBAL_LEVEL_ID
from app.services.level_generator import LevelGeneratorService

router = APIRouter()


@router.post("/generate", response_model=LevelResponse)
async def generate_level(
    body: LevelGenerateRequest,
    player_id: str = Depends(get_current_player),
    db: AsyncSession = Depends(get_db),
):
    service = LevelGeneratorService(db)
    level = await service.generate(
        player_id=player_id,
        difficulty=body.difficulty,
        theme=body.theme,
    )
    return level


@router.get("/daily", response_model=LevelResponse)
async def get_daily(db: AsyncSession = Depends(get_db)):
    service = LevelGeneratorService(db)
    level = await service.get_daily()
    if not level:
        raise HTTPException(status_code=404, detail="No daily level found")
    return level


@router.get("/{level_id}", response_model=LevelResponse)
async def get_level(level_id: str, db: AsyncSession = Depends(get_db)):
    service = LevelGeneratorService(db)
    if level_id == GLOBAL_LEVEL_ID:
        level = await service.get_or_create_global()
    else:
        level = await service.get_by_id(level_id)
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    return level
