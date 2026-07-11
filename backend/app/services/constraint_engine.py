"""Evaluates level constraints against a final placement.

Mirrors mobile/src/engine/constraints.ts — both sides must agree on
constraint semantics:

- zone {itemIds, zone}: every listed item is placed with all cells in the zone
- adjacency {itemIds: [a, b], mode: together|apart}: both placed and
  orthogonally touching (together) or fully separated (apart)
- exclusion {zone, minEmpty}: at least minEmpty free cells remain in the zone
- count {zone, maxItems}: at most maxItems distinct items occupy the zone
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ConstraintResult:
    constraint: dict
    satisfied: bool


def item_cells(placed_item: dict) -> set[tuple[int, int]]:
    anchor_row = placed_item.get("anchorRow", 0)
    anchor_col = placed_item.get("anchorCol", 0)
    shape = placed_item.get("rotatedShape") or placed_item.get("shape") or []
    return {
        (anchor_row + r, anchor_col + c)
        for r, row in enumerate(shape)
        for c, filled in enumerate(row)
        if filled
    }


def evaluate_constraints(
    grid: dict,
    placed_items: list[dict],
    constraints: list[dict],
) -> list[ConstraintResult]:
    cells_by_item = {item["id"]: item_cells(item) for item in placed_items}
    zone_by_cell: dict[tuple[int, int], str] = {}
    blocked_cells: set[tuple[int, int]] = set()
    for row in grid.get("cells", []):
        for cell in row:
            position = (cell["row"], cell["col"])
            zone_by_cell[position] = cell["zone"]
            if cell.get("blocked") or (cell.get("occupied") and not cell.get("itemId")):
                blocked_cells.add(position)

    occupied_cells = set().union(*cells_by_item.values()) if cells_by_item else set()

    results = []
    for constraint in constraints:
        results.append(
            ConstraintResult(
                constraint=constraint,
                satisfied=_check(
                    constraint, cells_by_item, zone_by_cell, blocked_cells, occupied_cells
                ),
            )
        )
    return results


def satisfied_points(results: list[ConstraintResult]) -> int:
    return sum(r.constraint.get("points", 0) for r in results if r.satisfied)


def _check(
    constraint: dict,
    cells_by_item: dict[str, set[tuple[int, int]]],
    zone_by_cell: dict[tuple[int, int], str],
    blocked_cells: set[tuple[int, int]],
    occupied_cells: set[tuple[int, int]],
) -> bool:
    params = constraint.get("params", {})
    kind = constraint.get("type")

    if kind == "zone":
        item_ids = params.get("itemIds", [])
        zone = params.get("zone")
        if not item_ids or not zone:
            return False
        for item_id in item_ids:
            cells = cells_by_item.get(item_id)
            if not cells:
                return False
            if any(zone_by_cell.get(cell) != zone for cell in cells):
                return False
        return True

    if kind == "adjacency":
        item_ids = params.get("itemIds", [])
        if len(item_ids) != 2:
            return False
        cells_a = cells_by_item.get(item_ids[0])
        cells_b = cells_by_item.get(item_ids[1])
        if not cells_a or not cells_b:
            return False
        touching = any(
            (r + dr, c + dc) in cells_b
            for r, c in cells_a
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1))
        )
        return touching if params.get("mode", "together") == "together" else not touching

    if kind == "exclusion":
        zone = params.get("zone")
        min_empty = params.get("minEmpty", 1)
        if not zone:
            return False
        free = sum(
            1
            for position, cell_zone in zone_by_cell.items()
            if cell_zone == zone
            and position not in occupied_cells
            and position not in blocked_cells
        )
        return free >= min_empty

    if kind == "count":
        zone = params.get("zone")
        max_items = params.get("maxItems")
        if not zone or max_items is None:
            return False
        items_in_zone = sum(
            1
            for cells in cells_by_item.values()
            if any(zone_by_cell.get(cell) == zone for cell in cells)
        )
        return items_in_zone <= max_items

    return False
