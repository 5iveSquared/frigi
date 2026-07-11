"""Reverse ("carve") level generation.

Instead of picking items and hoping they fit, we start from the finished
fridge: choose a grid, block a few cells with leftovers, reserve slack cells
that stay empty, then partition everything else into polyomino pieces. The
partition IS the solution, so every level ships tight and solvable by
construction. Difficulty knobs control slack, piece size/awkwardness, zone
locks, decoys and constraints; a solver pass measures the difficulty that
actually came out and the generator retries until it lands in band.
"""

import random
from dataclasses import dataclass

from app.content.item_catalog import ITEM_CATALOG
from app.services.pack_solver import PackSolver, measured_difficulty
from app.services.progression_model import MechanicProfile
from app.services.scoring_rules import (
    MOVE_BASE,
    MOVE_PENALTY,
    PACKING_MULTIPLIER,
    PAR_TIME_BONUS,
)

Cell = tuple[int, int]

# Food identities for carved pieces, keyed by the zone the piece locks to.
# Names must resolve to an emoji on mobile (shared catalog or EMOJI_MAP).
FOOD_POOLS: dict[str, list[tuple[str, str, str]]] = {
    "frozen": [
        ("ice-cream", "Ice Cream", "#A5F3FC"),
        ("frozen-pizza", "Frozen Pizza", "#FCA5A5"),
        ("fish-sticks", "Fish Sticks", "#93C5FD"),
        ("shrimp", "Shrimp", "#FDA4AF"),
        ("ice-pack", "Ice Pack", "#BFDBFE"),
    ],
    "cold": [
        ("milk", "Milk", "#FAFAFA"),
        ("yogurt", "Yogurt", "#BAE6FD"),
        ("berries", "Berries", "#FB7185"),
        ("juice", "Juice", "#FBBF24"),
        ("salmon", "Salmon", "#FDBA74"),
        ("ham", "Ham", "#F9A8D4"),
        ("bacon", "Bacon", "#FCA5A5"),
        ("chicken", "Chicken", "#FDE68A"),
        ("steak", "Steak", "#F87171"),
        ("sausage", "Sausage", "#FB923C"),
    ],
    "shelf": [
        ("eggs", "Eggs", "#FDE68A"),
        ("butter", "Butter", "#FCD34D"),
        ("jam", "Jam", "#F472B6"),
        ("hot-sauce", "Hot Sauce", "#EF4444"),
        ("chocolate", "Chocolate", "#A78BFA"),
        ("leftovers", "Leftovers", "#D4D4D8"),
    ],
    "standard": [
        ("cheese", "Cheese", "#F59E0B"),
        ("broccoli", "Broccoli", "#16A34A"),
        ("carrot", "Carrot", "#F97316"),
        ("apple", "Apple", "#F87171"),
        ("lettuce", "Lettuce", "#86EFAC"),
        ("tomato", "Tomato", "#EF4444"),
        ("onion", "Onion", "#E9D5FF"),
        ("pepper", "Pepper", "#4ADE80"),
        ("cucumber", "Cucumber", "#34D399"),
        ("avocado", "Avocado", "#65A30D"),
        ("mushroom", "Mushroom", "#E7E5E4"),
        ("grapes", "Grapes", "#C084FC"),
        ("lemon", "Lemon", "#FDE047"),
        ("orange", "Orange", "#FB923C"),
    ],
}

ZONE_DESCRIPTIONS = {
    "cold": "in the cold zone",
    "frozen": "in the freezer",
    "shelf": "on the top shelf",
    "standard": "in the pantry rows",
}


@dataclass(frozen=True)
class CarveResult:
    level_data: dict
    solution: list[dict]
    optimal_score: int
    measured: float
    solution_count: int
    backtracks: int


class CarveGenerator:
    MAX_ATTEMPTS = 8
    BAND_TOLERANCE = 0.06
    MIN_PIECES = 3
    MAX_PIECES = 12

    def __init__(self):
        self.solver = PackSolver()

    def generate(
        self,
        difficulty: float,
        theme: str | None,
        mechanics: MechanicProfile,
        seed_key: str,
    ) -> CarveResult:
        best: CarveResult | None = None
        for attempt in range(self.MAX_ATTEMPTS):
            rng = random.Random(f"{seed_key}:{attempt}")
            candidate = self._attempt(rng, difficulty, theme, mechanics)
            if candidate is None:
                continue
            if best is None or abs(candidate.measured - difficulty) < abs(best.measured - difficulty):
                best = candidate
            if abs(candidate.measured - difficulty) <= self.BAND_TOLERANCE:
                break
        if best is None:
            raise RuntimeError(f"carve generation failed for seed {seed_key}")
        return best

    def _attempt(
        self,
        rng: random.Random,
        difficulty: float,
        theme: str | None,
        mechanics: MechanicProfile,
    ) -> CarveResult | None:
        rows, cols = self._grid_size(difficulty)
        zone_of = self._zone_template(rng, rows, cols)

        all_cells = [(r, c) for r in range(rows) for c in range(cols)]
        blocked = self._pick_blocked_cells(rng, all_cells, zone_of, mechanics.blocked_cells)
        packable = [cell for cell in all_cells if cell not in blocked]

        slack_target = 0 if mechanics.exact_cover else self._slack_target(difficulty, len(packable))
        min_piece = 2 + (1 if difficulty >= 0.45 else 0) + (1 if difficulty >= 0.8 else 0)
        max_piece = max(min_piece + 1, 3 + round(3 * difficulty))
        snake_prob = 0.15 + 0.6 * difficulty

        pieces, slack = self._carve_pieces(
            rng, packable, len(packable) - slack_target, min_piece, max_piece, snake_prob, slack_target
        )
        if not (self.MIN_PIECES <= len(pieces) <= self.MAX_PIECES):
            return None
        if len(slack) > slack_target + 2:
            return None

        locked = self._lock_zones(rng, pieces, zone_of, difficulty)
        items, solution = self._pieces_to_items(rng, pieces, locked)
        decoys = self._pick_decoys(rng, items, len(slack), mechanics.decoy_items)
        constraints = self._build_constraints(
            rng, pieces, items, locked, zone_of, slack, mechanics.constraint_count
        )

        grid = self._build_grid_payload(rows, cols, zone_of, blocked)
        report = self.solver.solve(grid, items, count_solutions=True)
        if not report.solvable:
            return None

        measured = measured_difficulty(
            tightness=sum(len(p) for p in pieces) / len(packable),
            solution_count=report.solution_count,
            solutions_truncated=report.truncated,
            backtracks=report.backtracks,
            zone_locked_ratio=len(locked) / len(pieces),
            decoy_count=len(decoys),
            constraint_count=len(constraints),
        )

        optimal = (
            sum(item["points"] for item in items) * PACKING_MULTIPLIER
            + sum(c["points"] for c in constraints)
            + max(0, MOVE_BASE - MOVE_PENALTY * len(items))
            + PAR_TIME_BONUS
        )

        all_items = items + decoys
        rng.shuffle(all_items)

        return CarveResult(
            level_data={
                "grid": grid,
                "items": all_items,
                "constraints": constraints,
                "theme": theme or rng.choice(["kitchen", "meal_prep", "grocery", "holiday", "camping"]),
                "difficulty": measured,
            },
            solution=solution,
            optimal_score=optimal,
            measured=measured,
            solution_count=report.solution_count,
            backtracks=report.backtracks,
        )

    def _grid_size(self, difficulty: float) -> tuple[int, int]:
        if difficulty < 0.30:
            return 4, 4
        if difficulty < 0.45:
            return 5, 4
        if difficulty < 0.60:
            return 5, 5
        if difficulty < 0.72:
            return 6, 5
        if difficulty < 0.80:
            return 6, 6
        return 7, 6

    def _slack_target(self, difficulty: float, packable_area: int) -> int:
        fraction = max(0.02, 0.52 - 0.62 * difficulty)
        return max(0, round(packable_area * fraction))

    def _zone_template(self, rng: random.Random, rows: int, cols: int):
        variant = rng.randrange(4)
        cold_split = max(1, cols // 2)
        freezer_width = 2 if cols >= 6 else 1

        def classic(r: int, c: int) -> str:
            if r == 0:
                return "shelf"
            if r == rows - 1:
                return "frozen"
            return "cold" if c >= cold_split else "standard"

        def side_freezer(r: int, c: int) -> str:
            if c < freezer_width:
                return "frozen"
            if r == 0:
                return "shelf"
            if r == rows - 1:
                return "cold"
            return "standard"

        def bottom_drawer(r: int, c: int) -> str:
            if r >= rows - 2 and c >= cols - cold_split:
                return "frozen"
            if r == 0:
                return "shelf"
            if c == 0:
                return "cold"
            return "standard"

        def top_freezer(r: int, c: int) -> str:
            if r == 0:
                return "frozen"
            if r == 1:
                return "shelf"
            if r == rows - 1:
                return "cold"
            return "standard"

        return (classic, side_freezer, bottom_drawer, top_freezer)[variant]

    def _pick_blocked_cells(
        self,
        rng: random.Random,
        all_cells: list[Cell],
        zone_of,
        count: int,
    ) -> set[Cell]:
        if count <= 0:
            return set()
        blocked: set[Cell] = set()
        # keep special zones usable: never block them below 2 free cells
        zone_free = {"cold": 0, "frozen": 0, "shelf": 0, "standard": 0}
        for r, c in all_cells:
            zone_free[zone_of(r, c)] += 1

        candidates = list(all_cells)
        rng.shuffle(candidates)
        for cell in candidates:
            if len(blocked) >= count:
                break
            zone = zone_of(*cell)
            if zone != "standard" and zone_free[zone] <= 2:
                continue
            # cluster larger leftover blocks: after the first cell prefer
            # neighbours of existing blocked cells
            if blocked and count >= 3:
                touching = any(
                    (cell[0] + dr, cell[1] + dc) in blocked
                    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1))
                )
                if not touching and rng.random() < 0.6:
                    continue
            blocked.add(cell)
            zone_free[zone] -= 1
        return blocked

    def _carve_pieces(
        self,
        rng: random.Random,
        packable: list[Cell],
        target_area: int,
        min_piece: int,
        max_piece: int,
        snake_prob: float,
        slack_target: int,
    ) -> tuple[list[frozenset[Cell]], set[Cell]]:
        remaining = set(packable)
        pieces: list[set[Cell]] = []
        carved = 0

        while remaining and carved < target_area:
            size = min(rng.randint(min_piece, max(min_piece, max_piece)), target_area - carved)
            start = self._pick_start(rng, remaining)
            piece = [start]
            remaining.discard(start)
            while len(piece) < size:
                if rng.random() < snake_prob:
                    frontier = self._neighbors(piece[-1], remaining)
                else:
                    frontier = sorted(
                        {n for cell in piece for n in self._neighbors(cell, remaining)}
                    )
                if not frontier:
                    frontier = sorted(
                        {n for cell in piece for n in self._neighbors(cell, remaining)}
                    )
                    if not frontier:
                        break
                grown = rng.choice(frontier)
                piece.append(grown)
                remaining.discard(grown)
            pieces.append(set(piece))
            carved += len(piece)

        # merge stranded cells into neighbouring pieces until slack hits target
        for cell in sorted(remaining):
            if len(remaining) <= slack_target:
                break
            hosts = [
                piece
                for piece in pieces
                if len(piece) <= max_piece and self._neighbors(cell, piece)
            ]
            if hosts:
                smallest = min(hosts, key=len)
                smallest.add(cell)
                remaining.discard(cell)

        # absorb 1-cell pieces created by a capped final carve
        for piece in [p for p in pieces if len(p) == 1]:
            cell = next(iter(piece))
            hosts = [
                other
                for other in pieces
                if other is not piece and len(other) <= max_piece and self._neighbors(cell, other)
            ]
            if hosts and len(pieces) > self.MIN_PIECES:
                min(hosts, key=len).add(cell)
                pieces.remove(piece)

        return [frozenset(p) for p in pieces], remaining

    def _pick_start(self, rng: random.Random, remaining: set[Cell]) -> Cell:
        sample = rng.sample(sorted(remaining), min(4, len(remaining)))
        # prefer cells with few free neighbours so corners don't get stranded
        return min(sample, key=lambda cell: len(self._neighbors(cell, remaining)))

    def _neighbors(self, cell: Cell, pool) -> list[Cell]:
        r, c = cell
        return sorted(
            n for n in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)) if n in pool
        )

    def _lock_zones(
        self,
        rng: random.Random,
        pieces: list[frozenset[Cell]],
        zone_of,
        difficulty: float,
    ) -> dict[int, str]:
        lockable = []
        for index, piece in enumerate(pieces):
            zones = {zone_of(*cell) for cell in piece}
            if len(zones) == 1 and (zone := zones.pop()) in ("cold", "frozen", "shelf"):
                lockable.append((index, zone))
        rng.shuffle(lockable)
        lock_count = min(len(lockable), round(len(pieces) * (0.15 + 0.45 * difficulty)))
        return dict(lockable[:lock_count])

    def _pieces_to_items(
        self,
        rng: random.Random,
        pieces: list[frozenset[Cell]],
        locked: dict[int, str],
    ) -> tuple[list[dict], list[dict]]:
        used_ids: set[str] = set()
        items: list[dict] = []
        solution: list[dict] = []
        for index, piece in enumerate(pieces):
            anchor_row = min(r for r, _ in piece)
            anchor_col = min(c for _, c in piece)
            shape = self._shape_of(piece, anchor_row, anchor_col)
            zone = locked.get(index)
            food_id, name, color = self._pick_food(rng, zone, used_ids)
            used_ids.add(food_id)
            area = len(piece)
            awkward = self._is_awkward(shape)
            item = {
                "id": food_id,
                "name": name,
                "shape": shape,
                "zoneRequirement": zone,
                "points": area * 8 + (6 if awkward else 0),
                "color": color,
            }
            items.append(item)
            solution.append(
                {
                    "itemId": food_id,
                    "anchorRow": anchor_row,
                    "anchorCol": anchor_col,
                    "rotation": 0,
                    "shape": shape,
                }
            )
        return items, solution

    def _pick_food(
        self,
        rng: random.Random,
        zone: str | None,
        used_ids: set[str],
    ) -> tuple[str, str, str]:
        pools = [FOOD_POOLS[zone]] if zone else [FOOD_POOLS["standard"]]
        pools.append([food for pool in FOOD_POOLS.values() for food in pool])
        for pool in pools:
            available = [food for food in pool if food[0] not in used_ids]
            if available:
                return rng.choice(available)
        # every name taken (cannot happen with MAX_PIECES=12) — synthesize
        suffix = len(used_ids) + 1
        return (f"mystery-box-{suffix}", f"Mystery Box {suffix}", "#D4D4D8")

    def _pick_decoys(
        self,
        rng: random.Random,
        items: list[dict],
        slack: int,
        count: int,
    ) -> list[dict]:
        if count <= 0:
            return []
        used_ids = {item["id"] for item in items}
        decoys: list[dict] = []
        catalog = list(ITEM_CATALOG.items())
        rng.shuffle(catalog)
        for key, definition in catalog:
            if len(decoys) >= count:
                break
            if key in used_ids:
                continue
            # a decoy must not fit in the leftover slack alongside the full
            # pack, so par stays equal to packing every real piece
            variants = [v for v in definition["shape_variants"] if self._area(v) > slack]
            if not variants:
                continue
            shape = rng.choice(variants)
            decoys.append(
                {
                    "id": key,
                    "name": definition["name"],
                    "shape": [row[:] for row in shape],
                    "zoneRequirement": definition["zoneRequirement"],
                    "points": self._area(shape) * 5,
                    "color": definition["color"],
                }
            )
            used_ids.add(key)
        return decoys

    def _build_constraints(
        self,
        rng: random.Random,
        pieces: list[frozenset[Cell]],
        items: list[dict],
        locked: dict[int, str],
        zone_of,
        slack: set[Cell],
        count: int,
    ) -> list[dict]:
        if count <= 0:
            return []
        options: list[dict] = []

        adjacent_pairs = [
            (i, j)
            for i in range(len(pieces))
            for j in range(i + 1, len(pieces))
            if any(self._neighbors(cell, pieces[j]) for cell in pieces[i])
        ]
        if adjacent_pairs:
            i, j = rng.choice(adjacent_pairs)
            options.append(
                {
                    "id": f"adjacency-{items[i]['id']}-{items[j]['id']}",
                    "description": f"Keep {items[i]['name']} next to {items[j]['name']}",
                    "points": 60,
                    "type": "adjacency",
                    "params": {"itemIds": [items[i]["id"], items[j]["id"]], "mode": "together"},
                }
            )

        zone_prefs = []
        for index, piece in enumerate(pieces):
            if index in locked:
                continue
            zones = {zone_of(*cell) for cell in piece}
            if len(zones) == 1 and (zone := zones.pop()) in ("cold", "frozen", "shelf"):
                zone_prefs.append((index, zone))
        if zone_prefs:
            index, zone = rng.choice(zone_prefs)
            options.append(
                {
                    "id": f"zone-{items[index]['id']}",
                    "description": f"Store {items[index]['name']} {ZONE_DESCRIPTIONS[zone]}",
                    "points": 50,
                    "type": "zone",
                    "params": {"itemIds": [items[index]["id"]], "zone": zone},
                }
            )

        slack_by_zone: dict[str, int] = {}
        for cell in slack:
            slack_by_zone[zone_of(*cell)] = slack_by_zone.get(zone_of(*cell), 0) + 1
        if slack_by_zone:
            zone, free = rng.choice(sorted(slack_by_zone.items()))
            plural = "cells" if free > 1 else "cell"
            options.append(
                {
                    "id": f"keepclear-{zone}",
                    "description": f"Leave {free} {zone} {plural} free",
                    "points": 40,
                    "type": "exclusion",
                    "params": {"zone": zone, "minEmpty": free},
                }
            )

        items_by_zone: dict[str, int] = {}
        for piece in pieces:
            for zone in {zone_of(*cell) for cell in piece}:
                items_by_zone[zone] = items_by_zone.get(zone, 0) + 1
        crowded = [(z, n) for z, n in sorted(items_by_zone.items()) if z != "standard" and n >= 1]
        if crowded:
            zone, n = rng.choice(crowded)
            options.append(
                {
                    "id": f"count-{zone}",
                    "description": f"Fit at most {n} items in the {zone} zone",
                    "points": 40,
                    "type": "count",
                    "params": {"zone": zone, "maxItems": n},
                }
            )

        rng.shuffle(options)
        return options[:count]

    def _build_grid_payload(
        self,
        rows: int,
        cols: int,
        zone_of,
        blocked: set[Cell],
    ) -> dict:
        cells = []
        for r in range(rows):
            row = []
            for c in range(cols):
                is_blocked = (r, c) in blocked
                row.append(
                    {
                        "row": r,
                        "col": c,
                        "zone": zone_of(r, c),
                        "occupied": is_blocked,
                        "blocked": is_blocked,
                        "itemId": None,
                    }
                )
            cells.append(row)
        return {"rows": rows, "cols": cols, "cells": cells}

    def _shape_of(self, piece: frozenset[Cell], anchor_row: int, anchor_col: int) -> list[list[int]]:
        height = max(r for r, _ in piece) - anchor_row + 1
        width = max(c for _, c in piece) - anchor_col + 1
        shape = [[0] * width for _ in range(height)]
        for r, c in piece:
            shape[r - anchor_row][c - anchor_col] = 1
        return shape

    def _is_awkward(self, shape: list[list[int]]) -> bool:
        cells = sum(sum(row) for row in shape)
        return cells > 2 and cells < len(shape) * len(shape[0])

    def _area(self, shape: list[list[int]]) -> int:
        return sum(sum(row) for row in shape)
