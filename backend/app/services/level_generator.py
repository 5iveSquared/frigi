import logging
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.global_level import GLOBAL_LEVEL_ID, build_global_level_payload
from app.content.item_catalog import normalize_known_item
from app.models.level import Level
from app.models.player import Player
from app.models.player_difficulty_history import PlayerDifficultyHistory
from app.models.player_level_progress import PlayerLevelProgress
from app.services.carve_generator import CarveGenerator, CarveResult
from app.services.difficulty_engine import DifficultyEngine
from app.services.progression_model import CampaignProgressionModel

logger = logging.getLogger(__name__)


class LevelGeneratorService:
    DAILY_DIFFICULTY = 0.62

    def __init__(self, db: AsyncSession):
        self.db = db
        self.difficulty_engine = DifficultyEngine()
        self.progression_model = CampaignProgressionModel()
        self.carve_generator = CarveGenerator()

    async def generate(self, player_id: str, difficulty: float, theme: str | None = None) -> Level:
        progression_index = await self._next_progression_index(player_id)
        target_difficulty = await self._target_difficulty(player_id, progression_index, difficulty)
        logger.info(
            "level.generate.start player_id=%s progression_index=%s requested_difficulty=%s target_difficulty=%s",
            player_id,
            progression_index,
            difficulty,
            target_difficulty,
        )
        seeded_level = await self._get_seeded_campaign_level(progression_index)
        if seeded_level is not None:
            logger.info(
                "level.generate.seeded player_id=%s progression_index=%s level_id=%s",
                player_id,
                progression_index,
                seeded_level.id,
            )
            return seeded_level

        carve, normalized_level = self._carve_level(
            difficulty=target_difficulty,
            theme=theme,
            progression_index=progression_index,
            seed_key=f"{player_id}:{progression_index}:{datetime.now(timezone.utc).isoformat()}",
        )
        level = Level(
            id=str(uuid.uuid4()),
            grid_config=normalized_level["grid"],
            items=normalized_level["items"],
            constraints=normalized_level.get("constraints", []),
            theme=normalized_level["theme"],
            difficulty=normalized_level["difficulty"],
            progression_index=progression_index,
            optimal_score=carve.optimal_score,
        )
        self.db.add(level)
        await self.db.flush()
        logger.info(
            "level.generate.carved player_id=%s progression_index=%s level_id=%s measured_difficulty=%s items=%s",
            player_id,
            progression_index,
            level.id,
            carve.measured,
            len(normalized_level["items"]),
        )
        return level

    def _carve_level(
        self,
        difficulty: float,
        theme: str | None,
        progression_index: int,
        seed_key: str,
        daily: bool = False,
    ) -> tuple[CarveResult, dict]:
        mechanics = (
            self.progression_model.mechanics_for_daily()
            if daily
            else self.progression_model.mechanics_for_level(progression_index)
        )
        carve = self.carve_generator.generate(
            difficulty=difficulty,
            theme=theme,
            mechanics=mechanics,
            seed_key=seed_key,
        )
        # carved shapes are the solution — never snap them back to catalog shapes
        normalized = self._normalize_level_data(carve.level_data, snap_to_catalog=False)
        return carve, normalized

    async def _get_seeded_campaign_level(self, progression_index: int) -> Level | None:
        result = await self.db.execute(
            select(Level)
            .where(
                Level.is_daily == False,
                Level.progression_index == progression_index,
                Level.id.like("campaign-seed-%"),
            )
            .order_by(Level.id.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def _next_progression_index(self, player_id: str) -> int:
        result = await self.db.execute(
            select(PlayerLevelProgress.level_number)
            .where(
                PlayerLevelProgress.player_id == player_id,
                PlayerLevelProgress.completions > 0,
            )
            .order_by(PlayerLevelProgress.level_number.desc())
            .limit(1)
        )
        current = result.scalar_one_or_none()
        next_index = (current or 0) + 1
        logger.info(
            "level.progression.lookup player_id=%s highest_completed=%s next_index=%s",
            player_id,
            current,
            next_index,
        )
        return next_index

    async def _target_difficulty(
        self,
        player_id: str,
        progression_index: int,
        requested_difficulty: float,
    ) -> float:
        base_difficulty = self.progression_model.base_difficulty_for_level(progression_index)
        player_result = await self.db.execute(
            select(Player).where(Player.id == player_id)
        )
        player = player_result.scalar_one_or_none()
        if not player:
            blended = (base_difficulty * 0.9) + (requested_difficulty * 0.1)
            return self.progression_model.clamp_to_level_band(progression_index, blended)

        history_result = await self.db.execute(
            select(PlayerDifficultyHistory)
            .where(PlayerDifficultyHistory.player_id == player_id)
            .order_by(PlayerDifficultyHistory.created_at.desc())
            .limit(1)
        )
        last_history = history_result.scalar_one_or_none()
        elo_target = self.difficulty_engine.next_difficulty(player.elo_rating)

        if not last_history:
            initial = (base_difficulty * 0.85) + (elo_target * 0.15)
            return self.progression_model.clamp_to_level_band(progression_index, initial)

        delta = 0.04
        if last_history.performance_pct >= 0.9:
            delta += 0.03
        elif last_history.performance_pct >= 0.75:
            delta += 0.015
        elif last_history.performance_pct < 0.45:
            delta = -0.015

        elo_adjustment = (elo_target - base_difficulty) * 0.25
        requested_adjustment = (requested_difficulty - base_difficulty) * 0.1
        candidate = base_difficulty + delta + elo_adjustment + requested_adjustment
        return self.progression_model.clamp_to_level_band(progression_index, candidate)

    async def get_or_create_global(self) -> Level:
        result = await self.db.execute(select(Level).where(Level.id == GLOBAL_LEVEL_ID))
        existing = result.scalar_one_or_none()
        payload = build_global_level_payload()
        if existing:
            existing.grid_config = payload["grid"]
            existing.items = payload["items"]
            existing.constraints = payload.get("constraints", [])
            existing.theme = payload["theme"]
            existing.difficulty = payload["difficulty"]
            existing.optimal_score = payload["optimal_score"]
            existing.is_daily = payload.get("is_daily", False)
            existing.daily_date = payload.get("daily_date")
            await self.db.flush()
            return existing

        level = Level(
            id=GLOBAL_LEVEL_ID,
            grid_config=payload["grid"],
            items=payload["items"],
            constraints=payload.get("constraints", []),
            theme=payload["theme"],
            difficulty=payload["difficulty"],
            optimal_score=payload["optimal_score"],
            is_daily=payload.get("is_daily", False),
            daily_date=payload.get("daily_date"),
        )
        self.db.add(level)
        await self.db.flush()
        return level

    async def get_by_id(self, level_id: str) -> Level | None:
        result = await self.db.execute(select(Level).where(Level.id == level_id))
        return result.scalar_one_or_none()

    async def get_daily(self) -> Level | None:
        today = date.today()
        result = await self.db.execute(
            select(Level).where(Level.is_daily == True, Level.daily_date == today)
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        daily_id = f"daily-{today.isoformat()}"
        theme_rotation = ["kitchen", "meal_prep", "grocery", "holiday", "camping"]
        theme = theme_rotation[today.toordinal() % len(theme_rotation)]
        carve, normalized_level = self._carve_level(
            difficulty=self.DAILY_DIFFICULTY,
            theme=theme,
            progression_index=0,
            seed_key=daily_id,
            daily=True,
        )
        level = Level(
            id=daily_id,
            grid_config=normalized_level["grid"],
            items=normalized_level["items"],
            constraints=normalized_level.get("constraints", []),
            theme=normalized_level["theme"],
            difficulty=normalized_level["difficulty"],
            progression_index=0,
            optimal_score=carve.optimal_score,
            is_daily=True,
            daily_date=today,
        )
        self.db.add(level)
        await self.db.flush()
        return level

    def _normalize_level_data(self, level_data: dict, snap_to_catalog: bool = True) -> dict:
        grid = level_data.get("grid", {})
        normalized_cells = []
        for row in grid.get("cells", []):
            normalized_row = []
            for cell in row:
                blocked = bool(cell.get("blocked", False))
                normalized_row.append(
                    {
                        "row": cell["row"],
                        "col": cell["col"],
                        "zone": cell.get("zone", "standard"),
                        "occupied": bool(cell.get("occupied", False)) or blocked,
                        "blocked": blocked,
                        "itemId": cell.get("itemId", cell.get("item_id")),
                    }
                )
            normalized_cells.append(normalized_row)

        normalized_items = []
        seen_item_ids: set[str] = set()
        seen_item_names: set[str] = set()
        for item in level_data.get("items", []):
            normalized_known_item = normalize_known_item(item) if snap_to_catalog else None
            source_item = normalized_known_item or item
            item_id = self._normalize_item_id(source_item)
            item_name = self._normalize_item_name(source_item)
            item_name_key = self._normalize_item_key(item_name)
            if item_id in seen_item_ids or item_name_key in seen_item_names:
                continue
            normalized_items.append(
                {
                    "id": item_id,
                    "name": item_name,
                    "shape": source_item["shape"],
                    "zoneRequirement": source_item.get("zoneRequirement", source_item.get("zone_requirement")),
                    "points": source_item["points"],
                    "color": source_item["color"],
                }
            )
            seen_item_ids.add(item_id)
            seen_item_names.add(item_name_key)

        if len(normalized_items) < 3:
            raise ValueError("Level must contain at least 3 unique items")

        return {
            "grid": {
                "rows": grid.get("rows", 5),
                "cols": grid.get("cols", 4),
                "cells": normalized_cells,
            },
            "items": normalized_items,
            "constraints": level_data.get("constraints", []),
            "theme": level_data.get("theme", "kitchen"),
            "difficulty": float(level_data.get("difficulty", 0.3)),
        }

    def _normalize_item_id(self, item: dict) -> str:
        raw_id = str(item.get("id") or item.get("name") or "item").strip().lower()
        cleaned = "".join(char if char.isalnum() else "-" for char in raw_id)
        while "--" in cleaned:
            cleaned = cleaned.replace("--", "-")
        return cleaned.strip("-") or "item"

    def _normalize_item_name(self, item: dict) -> str:
        raw_name = str(item.get("name") or item.get("id") or "Item").strip()
        return " ".join(part for part in raw_name.split() if part)

    def _normalize_item_key(self, value: str) -> str:
        return "".join(char for char in value.lower() if char.isalnum())
