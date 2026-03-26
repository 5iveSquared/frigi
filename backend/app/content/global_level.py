GLOBAL_LEVEL_ID = "global-level-001"


def build_global_level_payload() -> dict:
    rows = 5
    cols = 4
    cells: list[list[dict]] = []

    for r in range(rows):
        row_cells = []
        for c in range(cols):
            if r == 0:
                zone = "shelf"
            elif r == rows - 1:
                zone = "frozen"
            elif c >= 1:
                zone = "cold"
            else:
                zone = "standard"

            row_cells.append(
                {
                    "row": r,
                    "col": c,
                    "zone": zone,
                    "occupied": False,
                    "itemId": None,
                }
            )
        cells.append(row_cells)

    return {
        "id": GLOBAL_LEVEL_ID,
        "difficulty": 0.3,
        "theme": "kitchen",
        "optimal_score": 1400,
        "is_daily": False,
        "daily_date": None,
        "constraints": [],
        "grid": {
            "rows": rows,
            "cols": cols,
            "cells": cells,
        },
        "items": [
            {
                "id": "milk",
                "name": "Milk",
                "shape": [[1], [1], [1]],
                "zoneRequirement": "cold",
                "points": 30,
                "color": "#FAFAFA",
            },
            {
                "id": "cheese",
                "name": "Cheese",
                "shape": [[1, 1], [1, 0]],
                "zoneRequirement": None,
                "points": 20,
                "color": "#F59E0B",
            },
            {
                "id": "broccoli",
                "name": "Broccoli",
                "shape": [[0, 1], [1, 1]],
                "zoneRequirement": None,
                "points": 25,
                "color": "#16A34A",
            },
            {
                "id": "butter",
                "name": "Butter",
                "shape": [[1, 1]],
                "zoneRequirement": "shelf",
                "points": 15,
                "color": "#FCD34D",
            },
            {
                "id": "yogurt",
                "name": "Yogurt",
                "shape": [[1, 1], [1, 1]],
                "zoneRequirement": "cold",
                "points": 20,
                "color": "#BAE6FD",
            },
            {
                "id": "carrot",
                "name": "Carrot",
                "shape": [[1], [1]],
                "zoneRequirement": None,
                "points": 10,
                "color": "#F97316",
            },
        ],
    }
