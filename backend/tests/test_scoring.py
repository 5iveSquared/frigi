import math
from app.services.scoring_service import ScoringService


def test_time_score_decay():
    # At t=0, score should be 500
    score = math.floor(500 * math.exp(-0.005 * 0))
    assert score == 500

    # At t=100s, score should decrease
    score_100 = math.floor(500 * math.exp(-0.005 * 100))
    assert score_100 < 500
    assert score_100 > 0


def test_move_score():
    assert max(0, 200 - 0 * 2) == 200
    assert max(0, 200 - 100 * 2) == 0
    assert max(0, 200 - 50 * 2) == 100


def test_star_rating_uses_score_ratio_against_optimal():
    service = ScoringService(db=None)

    assert service._star_rating(total_score=790, optimal_score=1000) == 1
    assert service._star_rating(total_score=800, optimal_score=1000) == 2
    assert service._star_rating(total_score=919, optimal_score=1000) == 2
    assert service._star_rating(total_score=920, optimal_score=1000) == 3


def _grid_2x2(zone: str = "standard") -> dict:
    return {
        "rows": 2,
        "cols": 2,
        "cells": [
            [
                {"row": r, "col": c, "zone": zone, "occupied": False, "blocked": False, "itemId": None}
                for c in range(2)
            ]
            for r in range(2)
        ],
    }


def test_validate_placements_rejects_forged_and_overlapping_items():
    service = ScoringService(db=None)
    level_items = [
        {"id": "a", "shape": [[1, 1]], "zoneRequirement": None, "points": 16},
        {"id": "b", "shape": [[1]], "zoneRequirement": None, "points": 8},
    ]
    placed = [
        {"id": "a", "anchorRow": 0, "anchorCol": 0, "rotatedShape": [[1, 1]]},
        # overlaps item a
        {"id": "b", "anchorRow": 0, "anchorCol": 1, "rotatedShape": [[1]]},
        # not a level item
        {"id": "ghost", "anchorRow": 1, "anchorCol": 0, "rotatedShape": [[1]]},
    ]

    validated = service._validate_placements(_grid_2x2(), placed, level_items)

    assert [item["id"] for item in validated] == ["a"]


def test_validate_placements_rejects_invented_shapes():
    service = ScoringService(db=None)
    level_items = [{"id": "a", "shape": [[1]], "zoneRequirement": None, "points": 8}]
    placed = [{"id": "a", "anchorRow": 0, "anchorCol": 0, "rotatedShape": [[1, 1, 1]]}]

    assert service._validate_placements(_grid_2x2(), placed, level_items) == []


def test_calc_packing_scores_points_of_validated_items():
    service = ScoringService(db=None)
    level_items = [
        {"id": "a", "shape": [[1, 1]], "zoneRequirement": None, "points": 16},
        {"id": "b", "shape": [[1]], "zoneRequirement": None, "points": 8},
    ]
    validated = [
        {"id": "a", "anchorRow": 0, "anchorCol": 0, "rotatedShape": [[1, 1]]},
    ]

    packing, fill = service._calc_packing(_grid_2x2(), validated, level_items)

    assert packing == 160
    assert fill == 0.5
