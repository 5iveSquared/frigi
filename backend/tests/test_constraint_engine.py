from app.services.constraint_engine import evaluate_constraints, satisfied_points


def _grid(rows: int = 3, cols: int = 3, zones: dict | None = None) -> dict:
    zones = zones or {}
    return {
        "rows": rows,
        "cols": cols,
        "cells": [
            [
                {
                    "row": r,
                    "col": c,
                    "zone": zones.get((r, c), "standard"),
                    "occupied": False,
                    "blocked": False,
                    "itemId": None,
                }
                for c in range(cols)
            ]
            for r in range(rows)
        ],
    }


def _placed(item_id: str, row: int, col: int, shape=None) -> dict:
    return {
        "id": item_id,
        "anchorRow": row,
        "anchorCol": col,
        "rotatedShape": shape or [[1]],
    }


def test_zone_constraint_requires_all_cells_in_zone():
    grid = _grid(zones={(0, 0): "cold", (0, 1): "cold"})
    constraint = {
        "id": "z",
        "type": "zone",
        "points": 50,
        "params": {"itemIds": ["milk"], "zone": "cold"},
    }

    inside = evaluate_constraints(grid, [_placed("milk", 0, 0, [[1, 1]])], [constraint])
    straddling = evaluate_constraints(grid, [_placed("milk", 0, 1, [[1, 1]])], [constraint])
    missing = evaluate_constraints(grid, [], [constraint])

    assert inside[0].satisfied
    assert not straddling[0].satisfied
    assert not missing[0].satisfied


def test_adjacency_together_and_apart():
    grid = _grid()
    together = {
        "id": "a",
        "type": "adjacency",
        "points": 60,
        "params": {"itemIds": ["a", "b"], "mode": "together"},
    }
    apart = {**together, "params": {"itemIds": ["a", "b"], "mode": "apart"}}

    touching = [_placed("a", 0, 0), _placed("b", 0, 1)]
    separated = [_placed("a", 0, 0), _placed("b", 2, 2)]

    assert evaluate_constraints(grid, touching, [together])[0].satisfied
    assert not evaluate_constraints(grid, separated, [together])[0].satisfied
    assert evaluate_constraints(grid, separated, [apart])[0].satisfied
    assert not evaluate_constraints(grid, touching, [apart])[0].satisfied


def test_exclusion_counts_free_zone_cells():
    grid = _grid(zones={(0, 0): "shelf", (0, 1): "shelf", (0, 2): "shelf"})
    constraint = {
        "id": "e",
        "type": "exclusion",
        "points": 40,
        "params": {"zone": "shelf", "minEmpty": 2},
    }

    one_taken = evaluate_constraints(grid, [_placed("x", 0, 0)], [constraint])
    two_taken = evaluate_constraints(
        grid, [_placed("x", 0, 0), _placed("y", 0, 1)], [constraint]
    )

    assert one_taken[0].satisfied
    assert not two_taken[0].satisfied


def test_count_limits_distinct_items_in_zone():
    grid = _grid(zones={(0, 0): "frozen", (0, 1): "frozen"})
    constraint = {
        "id": "c",
        "type": "count",
        "points": 40,
        "params": {"zone": "frozen", "maxItems": 1},
    }

    one_item = evaluate_constraints(grid, [_placed("a", 0, 0)], [constraint])
    two_items = evaluate_constraints(
        grid, [_placed("a", 0, 0), _placed("b", 0, 1)], [constraint]
    )

    assert one_item[0].satisfied
    assert not two_items[0].satisfied


def test_satisfied_points_sums_only_met_constraints():
    grid = _grid(zones={(0, 0): "cold"})
    constraints = [
        {"id": "z", "type": "zone", "points": 50, "params": {"itemIds": ["milk"], "zone": "cold"}},
        {"id": "e", "type": "exclusion", "points": 40, "params": {"zone": "cold", "minEmpty": 1}},
    ]

    results = evaluate_constraints(grid, [_placed("milk", 0, 0)], constraints)

    assert satisfied_points(results) == 50
