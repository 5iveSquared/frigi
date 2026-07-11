import math
from dataclasses import dataclass


@dataclass(frozen=True)
class Placement:
    item_id: str
    anchor_row: int
    anchor_col: int
    shape: tuple[tuple[int, ...], ...]


@dataclass(frozen=True)
class SolveReport:
    solvable: bool
    solution: tuple[Placement, ...]
    solution_count: int
    backtracks: int
    truncated: bool


class PackSolver:
    """Exact packing solver mirroring mobile/src/engine/solver.ts.

    Uses bitmask occupancy and most-constrained-item-first ordering. Tracks
    backtracks as the search-effort signal for measured difficulty, and can
    count solutions up to a cap to detect levels that are too loose.
    """

    def __init__(self, max_backtracks: int = 40_000, max_solutions: int = 200):
        self.max_backtracks = max_backtracks
        self.max_solutions = max_solutions

    def solve(self, grid: dict, items: list[dict], count_solutions: bool = False) -> SolveReport:
        rows = grid["rows"]
        cols = grid["cols"]
        base_mask = 0
        zone_by_cell = [""] * (rows * cols)
        for row in grid["cells"]:
            for cell in row:
                index = cell["row"] * cols + cell["col"]
                zone_by_cell[index] = cell["zone"]
                if cell.get("occupied") or cell.get("blocked"):
                    base_mask |= 1 << index

        candidates_by_item = [
            self._placements_for_item(item, rows, cols, zone_by_cell, base_mask)
            for item in items
        ]
        # items with identical shape+zone are interchangeable — count solutions
        # by which cells each shape class covers, not by item identity
        shape_class_by_item = [
            (min(unique_rotations(item["shape"])), item.get("zoneRequirement"))
            for item in items
        ]

        state = {
            "backtracks": 0,
            "solutions": set(),
            "first": None,
            "truncated": False,
        }
        order = sorted(range(len(items)), key=lambda i: len(candidates_by_item[i]))

        def backtrack(
            occupied: int,
            remaining: list[int],
            placed: list[tuple[int, int, Placement]],
        ) -> None:
            if state["truncated"]:
                return
            if not remaining:
                signature = frozenset(
                    (shape_class_by_item[item_index], mask)
                    for item_index, mask, _ in placed
                )
                state["solutions"].add(signature)
                if state["first"] is None:
                    state["first"] = tuple(
                        p for _, _, p in sorted(placed, key=lambda entry: entry[0])
                    )
                if len(state["solutions"]) >= self.max_solutions:
                    state["truncated"] = True
                return

            best_index = -1
            best_options: list[tuple[int, Placement]] | None = None
            for position, item_index in enumerate(remaining):
                options = [
                    (mask, placement)
                    for mask, placement in candidates_by_item[item_index]
                    if not (mask & occupied)
                ]
                if not options:
                    state["backtracks"] += 1
                    if state["backtracks"] >= self.max_backtracks:
                        state["truncated"] = True
                    return
                if best_options is None or len(options) < len(best_options):
                    best_options = options
                    best_index = position
                    if len(options) == 1:
                        break

            next_remaining = remaining[:best_index] + remaining[best_index + 1 :]
            item_index = remaining[best_index]
            for mask, placement in best_options:
                backtrack(
                    occupied | mask,
                    next_remaining,
                    placed + [(item_index, mask, placement)],
                )
                if state["truncated"]:
                    return
                if not count_solutions and state["solutions"]:
                    return

        backtrack(base_mask, order, [])

        return SolveReport(
            solvable=bool(state["solutions"]),
            solution=state["first"] or (),
            solution_count=len(state["solutions"]),
            backtracks=state["backtracks"],
            truncated=state["truncated"],
        )

    def _placements_for_item(
        self,
        item: dict,
        rows: int,
        cols: int,
        zone_by_cell: list[str],
        base_mask: int,
    ) -> list[tuple[int, Placement]]:
        placements: list[tuple[int, Placement]] = []
        zone_requirement = item.get("zoneRequirement")
        for shape in unique_rotations(item["shape"]):
            shape_rows = len(shape)
            shape_cols = len(shape[0])
            for anchor_row in range(rows - shape_rows + 1):
                for anchor_col in range(cols - shape_cols + 1):
                    mask = 0
                    valid = True
                    for r, shape_row in enumerate(shape):
                        for c, filled in enumerate(shape_row):
                            if not filled:
                                continue
                            index = (anchor_row + r) * cols + (anchor_col + c)
                            if zone_requirement and zone_by_cell[index] != zone_requirement:
                                valid = False
                                break
                            mask |= 1 << index
                        if not valid:
                            break
                    if valid and not (mask & base_mask):
                        placements.append(
                            (mask, Placement(item["id"], anchor_row, anchor_col, shape))
                        )
        return placements


def unique_rotations(shape: list[list[int]]) -> list[tuple[tuple[int, ...], ...]]:
    rotations = []
    seen = set()
    current = tuple(tuple(row) for row in shape)
    for _ in range(4):
        if current not in seen:
            rotations.append(current)
            seen.add(current)
        current = tuple(
            tuple(current[len(current) - 1 - r][c] for r in range(len(current)))
            for c in range(len(current[0]))
        )
    return rotations


def measured_difficulty(
    tightness: float,
    solution_count: int,
    solutions_truncated: bool,
    backtracks: int,
    zone_locked_ratio: float,
    decoy_count: int,
    constraint_count: int,
) -> float:
    """Blend structural pressure with observed search behaviour into 0–1.

    Tightness dominates because it is the knob the carve generator controls
    directly; solver signals (scarcity, effort) correct for layouts that are
    accidentally loose or accidentally brutal.
    """
    if solutions_truncated:
        scarcity = 0.0
    else:
        scarcity = 1.0 - min(1.0, math.log10(max(solution_count, 1)) / 3.0)
    effort = min(1.0, math.log10(1 + backtracks) / 3.5)
    decoy_pressure = min(1.0, decoy_count * 0.34)
    constraint_pressure = min(1.0, constraint_count * 0.34)

    score = (
        0.04
        + tightness * 0.34
        + scarcity * 0.20
        + effort * 0.15
        + zone_locked_ratio * 0.10
        + decoy_pressure * 0.08
        + constraint_pressure * 0.06
    )
    return max(0.0, min(1.0, round(score, 3)))
