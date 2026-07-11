"""Regenerate the campaign seed levels with the carve pipeline.

Upserts `campaign-seed-01` … `campaign-seed-50` using the progression model's
difficulty curve and mechanic schedule. Run after any generator or curve
change so live players get the redesigned levels:

    cd backend && PYTHONPATH=. .venv/bin/python scripts/seed_campaign_levels.py
"""

import asyncio

from sqlalchemy import select

from app.db.session import async_session_factory
from app.models.level import Level
from app.services.level_generator import LevelGeneratorService
from app.services.progression_model import CampaignProgressionModel


async def seed() -> None:
    model = CampaignProgressionModel()
    async with async_session_factory() as db:
        generator = LevelGeneratorService(db)
        for spec in model.seed_specs():
            carve, normalized = generator._carve_level(
                difficulty=spec.difficulty,
                theme=spec.theme,
                progression_index=spec.progression_index,
                seed_key=spec.id,
            )
            result = await db.execute(select(Level).where(Level.id == spec.id))
            level = result.scalar_one_or_none()
            if level is None:
                level = Level(id=spec.id)
                db.add(level)
            level.grid_config = normalized["grid"]
            level.items = normalized["items"]
            level.constraints = normalized.get("constraints", [])
            level.theme = normalized["theme"]
            level.difficulty = normalized["difficulty"]
            level.progression_index = spec.progression_index
            level.optimal_score = carve.optimal_score
            level.is_daily = False
            print(
                f"{spec.id}: difficulty={normalized['difficulty']} "
                f"items={len(normalized['items'])} optimal={carve.optimal_score}"
            )
        await db.commit()
    print("done — 50 campaign seeds upserted")


if __name__ == "__main__":
    asyncio.run(seed())
