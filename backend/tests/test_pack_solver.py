from app.services.pack_solver import PackSolver, measured_difficulty, unique_rotations


def _grid(rows: int, cols: int, zone: str = "standard", blocked: set | None = None) -> dict:
    blocked = blocked or set()
    return {
        "rows": rows,
        "cols": cols,
        "cells": [
            [
                {
                    "row": r,
                    "col": c,
                    "zone": zone,
                    "occupied": (r, c) in blocked,
                    "blocked": (r, c) in blocked,
                    "itemId": None,
                }
                for c in range(cols)
            ]
            for r in range(rows)
        ],
    }


def _item(item_id: str, shape: list[list[int]], zone: str | None = None) -> dict:
    return {"id": item_id, "shape": shape, "zoneRequirement": zone}


def test_solver_finds_exact_cover():
    grid = _grid(2, 2)
    items = [_item("a", [[1, 1]]), _item("b", [[1, 1]])]

    report = PackSolver().solve(grid, items, count_solutions=True)

    assert report.solvable
    assert len(report.solution) == 2
    # two horizontal bars in a 2x2: one distinct arrangement (items interchangeable),
    # plus the vertical arrangement = 2 deduped solutions
    assert report.solution_count == 2


def test_solver_reports_unsolvable():
    grid = _grid(2, 2)
    items = [_item("a", [[1, 1, 1]]), _item("b", [[1, 1]])]

    report = PackSolver().solve(grid, items)

    assert not report.solvable
    assert report.solution_count == 0


def test_solver_respects_zone_requirements():
    grid = _grid(2, 2, zone="standard")
    grid["cells"][0][0]["zone"] = "cold"
    items = [_item("a", [[1]], zone="cold"), _item("b", [[1]], zone="frozen")]

    report = PackSolver().solve(grid, items)

    assert not report.solvable


def test_solver_respects_blocked_cells():
    grid = _grid(2, 2, blocked={(0, 0)})
    items = [_item("a", [[1, 1], [1, 1]])]

    report = PackSolver().solve(grid, items)

    assert not report.solvable


def test_unique_rotations_dedupes_symmetric_shapes():
    assert len(unique_rotations([[1, 1], [1, 1]])) == 1
    assert len(unique_rotations([[1, 1]])) == 2
    assert len(unique_rotations([[1, 1], [1, 0]])) == 4


def test_measured_difficulty_increases_with_pressure():
    loose = measured_difficulty(
        tightness=0.55,
        solution_count=200,
        solutions_truncated=True,
        backtracks=5,
        zone_locked_ratio=0.0,
        decoy_count=0,
        constraint_count=0,
    )
    tight = measured_difficulty(
        tightness=1.0,
        solution_count=1,
        solutions_truncated=False,
        backtracks=5000,
        zone_locked_ratio=0.5,
        decoy_count=2,
        constraint_count=2,
    )
    assert loose < 0.4
    assert tight > 0.75
    assert loose < tight
