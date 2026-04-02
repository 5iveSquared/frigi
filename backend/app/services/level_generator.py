import asyncio
import itertools
import json
import random
import uuid
from datetime import date, datetime, timezone

from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.content.global_level import GLOBAL_LEVEL_ID, build_global_level_payload
from app.models.level import Level
from app.models.player import Player
from app.models.player_difficulty_history import PlayerDifficultyHistory
from app.models.player_level_progress import PlayerLevelProgress
from app.mcp.prompts import build_level_prompt
from app.mcp.level_tools import CREATE_LEVEL_TOOL
from app.services.difficulty_engine import DifficultyEngine
from app.services.progression_model import CampaignProgressionModel


class LevelGeneratorService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.difficulty_engine = DifficultyEngine()
        self.progression_model = CampaignProgressionModel()

    async def generate(self, player_id: str, difficulty: float, theme: str | None = None) -> Level:
        progression_index = await self._next_progression_index(player_id)
        target_difficulty = await self._target_difficulty(player_id, progression_index, difficulty)
        seeded_level = await self._get_seeded_campaign_level(progression_index)
        if seeded_level is not None:
            return seeded_level
        level_data = await self._generate_level_data(target_difficulty, theme, player_id)
        try:
            normalized_level = self._normalize_level_data(level_data)
        except Exception:
            normalized_level = self._normalize_level_data(
                self._generate_procedural_level(target_difficulty, theme, player_id)
            )

        level = Level(
            id=str(uuid.uuid4()),
            grid_config=normalized_level["grid"],
            items=normalized_level["items"],
            constraints=normalized_level.get("constraints", []),
            theme=normalized_level["theme"],
            difficulty=normalized_level["difficulty"],
            progression_index=progression_index,
            optimal_score=self._estimate_optimal(normalized_level),
        )
        self.db.add(level)
        await self.db.flush()
        return level

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
        return (current or 0) + 1

    async def _generate_level_data(
        self,
        difficulty: float,
        theme: str | None,
        player_id: str,
    ) -> dict:
        if self.client:
            try:
                return await asyncio.wait_for(
                    self._generate_with_ai(difficulty, theme),
                    timeout=settings.openai_timeout_seconds,
                )
            except Exception:
                pass
        return self._generate_procedural_level(difficulty, theme, player_id)

    async def _generate_with_ai(self, difficulty: float, theme: str | None) -> dict:
        prompt = build_level_prompt(difficulty=difficulty, theme=theme)

        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a puzzle designer for Frigi, a fridge-packing puzzle game. "
                        "Create varied, fun, solvable puzzles. Always call the create_level tool."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            tools=[{"type": "function", "function": CREATE_LEVEL_TOOL}],
            tool_choice={"type": "function", "function": {"name": "create_level"}},
        )

        tool_call = response.choices[0].message.tool_calls[0]
        return json.loads(tool_call.function.arguments)

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
        daily_data = self._generate_procedural_level(
            difficulty=0.55,
            theme=theme,
            player_id=daily_id,
            seed_key=daily_id,
        )
        normalized_level = self._normalize_level_data(daily_data)
        level = Level(
            id=daily_id,
            grid_config=normalized_level["grid"],
            items=normalized_level["items"],
            constraints=normalized_level.get("constraints", []),
            theme=normalized_level["theme"],
            difficulty=normalized_level["difficulty"],
            progression_index=0,
            optimal_score=self._estimate_optimal(normalized_level),
            is_daily=True,
            daily_date=today,
        )
        self.db.add(level)
        await self.db.flush()
        return level

    def _estimate_optimal(self, level_data: dict) -> int:
        grid = level_data.get("grid", {})
        rows = grid.get("rows", 5)
        cols = grid.get("cols", 4)
        items = level_data.get("items", [])
        item_cells = sum(
            sum(cell for row in item["shape"] for cell in row) for item in items
        )
        fill_ratio = item_cells / (rows * cols) if rows * cols > 0 else 0
        efficiency = int(fill_ratio * rows * cols * 100)
        constraints = sum(c.get("points", 0) for c in level_data.get("constraints", []))
        return efficiency + 500 + constraints + 200

    def _normalize_level_data(self, level_data: dict) -> dict:
        grid = level_data.get("grid", {})
        normalized_cells = []
        for row in grid.get("cells", []):
            normalized_row = []
            for cell in row:
                normalized_row.append(
                    {
                        "row": cell["row"],
                        "col": cell["col"],
                        "zone": cell.get("zone", "standard"),
                        "occupied": cell.get("occupied", False),
                        "itemId": cell.get("itemId", cell.get("item_id")),
                    }
                )
            normalized_cells.append(normalized_row)

        normalized_items = []
        seen_item_ids: set[str] = set()
        seen_item_names: set[str] = set()
        for item in level_data.get("items", []):
            item_id = self._normalize_item_id(item)
            item_name = self._normalize_item_name(item)
            item_name_key = self._normalize_item_key(item_name)
            if item_id in seen_item_ids or item_name_key in seen_item_names:
                continue
            normalized_items.append(
                {
                    "id": item_id,
                    "name": item_name,
                    "shape": item["shape"],
                    "zoneRequirement": item.get("zoneRequirement", item.get("zone_requirement")),
                    "points": item["points"],
                    "color": item["color"],
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

    def _generate_procedural_level(
        self,
        difficulty: float,
        theme: str | None,
        player_id: str,
        seed_key: str | None = None,
    ) -> dict:
        seed = seed_key or f"{player_id}:{difficulty:.2f}:{datetime.now(timezone.utc).isoformat()}"
        rng = random.Random(seed)

        layouts = [
            (0.0, {"rows": 4, "cols": 4, "item_count": 4, "fill_ratio": 0.42}),
            (0.26, {"rows": 5, "cols": 4, "item_count": 5, "fill_ratio": 0.5}),
            (0.48, {"rows": 5, "cols": 5, "item_count": 6, "fill_ratio": 0.57}),
            (0.68, {"rows": 6, "cols": 5, "item_count": 7, "fill_ratio": 0.64}),
        ]
        config = layouts[0][1]
        for threshold, candidate in layouts:
            if difficulty >= threshold:
                config = candidate

        rows = config["rows"]
        cols = config["cols"]
        grid_area = rows * cols
        full_item_catalog = [
            {"id": "milk", "name": "Milk", "shape": [[1], [1], [1]], "zoneRequirement": "cold", "points": 30, "color": "#FAFAFA"},
            {"id": "cheese", "name": "Cheese", "shape": [[1, 1], [1, 0]], "zoneRequirement": None, "points": 20, "color": "#F59E0B"},
            {"id": "broccoli", "name": "Broccoli", "shape": [[0, 1], [1, 1]], "zoneRequirement": None, "points": 25, "color": "#16A34A"},
            {"id": "butter", "name": "Butter", "shape": [[1, 1]], "zoneRequirement": "shelf", "points": 15, "color": "#FCD34D"},
            {"id": "yogurt", "name": "Yogurt", "shape": [[1, 1], [1, 1]], "zoneRequirement": "cold", "points": 20, "color": "#BAE6FD"},
            {"id": "carrot", "name": "Carrot", "shape": [[1], [1]], "zoneRequirement": None, "points": 10, "color": "#F97316"},
            {"id": "peas", "name": "Peas", "shape": [[1, 1, 1]], "zoneRequirement": "frozen", "points": 18, "color": "#34D399"},
            {"id": "juice", "name": "Juice", "shape": [[1], [1]], "zoneRequirement": "cold", "points": 14, "color": "#FBBF24"},
            {"id": "eggs", "name": "Eggs", "shape": [[1, 1], [1, 1]], "zoneRequirement": "shelf", "points": 22, "color": "#FDE68A"},
            {"id": "berries", "name": "Berries", "shape": [[1, 1, 0], [0, 1, 1]], "zoneRequirement": "cold", "points": 28, "color": "#FB7185"},
        ]
        grid = self._build_grid(rows, cols)
        minimum_placements = self._minimum_valid_placements(difficulty)
        item_catalog = [
            item
            for item in full_item_catalog
            if self._item_has_minimum_placements(grid, item, minimum_placements)
        ]
        if len(item_catalog) < 3 and minimum_placements > 1:
            item_catalog = [
                item for item in full_item_catalog if self._item_has_valid_placement(grid, item)
            ]

        rng.shuffle(item_catalog)
        target_item_count = min(config["item_count"], len(item_catalog))
        target_item_area = self._target_item_area(item_catalog, grid_area, config["fill_ratio"], target_item_count)
        selected_items = self._select_items_for_layout(
            item_catalog=item_catalog,
            target_item_count=target_item_count,
            target_item_area=target_item_area,
        )

        constraints = []
        if difficulty >= 0.35:
            cold_items = [item["id"] for item in selected_items if item.get("zoneRequirement") == "cold"]
            if cold_items:
                constraints.append(
                    {
                        "id": "cold-items-top-half",
                        "description": "Keep chilled items away from the freezer row.",
                        "points": 50,
                        "type": "zone",
                        "params": {"itemIds": cold_items, "zone": "cold"},
                    }
                )
        if difficulty >= 0.6:
            shelf_items = [item["id"] for item in selected_items if item.get("zoneRequirement") == "shelf"]
            if shelf_items:
                constraints.append(
                    {
                        "id": "shelf-separation",
                        "description": "Shelf items should stay easy to reach on the top shelf.",
                        "points": 75,
                        "type": "count",
                        "params": {"itemIds": shelf_items, "zone": "shelf"},
                    }
                )

        return {
            "grid": grid,
            "items": selected_items,
            "constraints": constraints,
            "theme": theme or rng.choice(["kitchen", "meal_prep", "grocery", "holiday", "camping"]),
            "difficulty": difficulty,
        }

    def _item_area(self, item: dict) -> int:
        return sum(sum(row) for row in item["shape"])

    def _target_item_area(
        self,
        item_catalog: list[dict],
        grid_area: int,
        fill_ratio: float,
        target_item_count: int,
    ) -> int:
        configured_area = max(6, int(grid_area * fill_ratio))
        if target_item_count <= 0 or not item_catalog:
            return configured_area
        minimum_feasible_area = sum(
            sorted(self._item_area(item) for item in item_catalog)[:target_item_count]
        )
        return max(configured_area, minimum_feasible_area)

    def _select_items_for_layout(
        self,
        item_catalog: list[dict],
        target_item_count: int,
        target_item_area: int,
    ) -> list[dict]:
        if not item_catalog:
            return []

        minimum_count = min(3, len(item_catalog))
        best_combo: tuple[dict, ...] | None = None
        best_score: tuple[int, int, int] | None = None

        for count in range(target_item_count, minimum_count - 1, -1):
            for combo in itertools.combinations(item_catalog, count):
                area = sum(self._item_area(item) for item in combo)
                deficit = max(0, target_item_area - area)
                overflow = max(0, area - target_item_area)
                score = (-count, deficit, overflow)
                if best_score is None or score < best_score:
                    best_score = score
                    best_combo = combo
            if best_combo is not None and len(best_combo) == count:
                break

        if best_combo is not None:
            return list(best_combo)
        return item_catalog[:minimum_count]

    def _build_grid(self, rows: int, cols: int) -> dict:
        cells = []
        for row in range(rows):
            current_row = []
            for col in range(cols):
                if row == 0:
                    zone = "shelf"
                elif row == rows - 1:
                    zone = "frozen"
                elif col >= max(1, cols // 2):
                    zone = "cold"
                else:
                    zone = "standard"
                current_row.append(
                    {
                        "row": row,
                        "col": col,
                        "zone": zone,
                        "occupied": False,
                        "itemId": None,
                    }
                )
            cells.append(current_row)
        return {"rows": rows, "cols": cols, "cells": cells}

    def _item_has_valid_placement(self, grid: dict, item: dict) -> bool:
        return self._item_has_minimum_placements(grid, item, 1)

    def _item_has_minimum_placements(self, grid: dict, item: dict, minimum_count: int) -> bool:
        placement_count = 0
        for shape in self._rotations(item["shape"]):
            shape_rows = len(shape)
            shape_cols = len(shape[0]) if shape else 0
            for anchor_row in range(grid["rows"] - shape_rows + 1):
                for anchor_col in range(grid["cols"] - shape_cols + 1):
                    if self._placement_valid(grid, item.get("zoneRequirement"), shape, anchor_row, anchor_col):
                        placement_count += 1
                        if placement_count >= minimum_count:
                            return True
        return False

    def _minimum_valid_placements(self, difficulty: float) -> int:
        if difficulty < 0.35:
            return 3
        if difficulty < 0.55:
            return 2
        return 1

    def _placement_valid(
        self,
        grid: dict,
        zone_requirement: str | None,
        shape: list[list[int]],
        anchor_row: int,
        anchor_col: int,
    ) -> bool:
        for row_index, row in enumerate(shape):
            for col_index, cell in enumerate(row):
                if cell != 1:
                    continue
                grid_cell = grid["cells"][anchor_row + row_index][anchor_col + col_index]
                if zone_requirement and grid_cell["zone"] != zone_requirement:
                    return False
        return True

    def _rotations(self, shape: list[list[int]]) -> list[list[list[int]]]:
        rotations = []
        current = shape
        seen = set()
        for _ in range(4):
            key = tuple(tuple(row) for row in current)
            if key not in seen:
                rotations.append(current)
                seen.add(key)
            current = self._rotate_90(current)
        return rotations

    def _rotate_90(self, shape: list[list[int]]) -> list[list[int]]:
        return [
            [shape[len(shape) - 1 - row_index][col_index] for row_index in range(len(shape))]
            for col_index in range(len(shape[0]))
        ]
