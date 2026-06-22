from app.content.item_catalog import build_catalog_item


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
            build_catalog_item("milk"),
            build_catalog_item("cheese"),
            build_catalog_item("broccoli"),
            build_catalog_item("butter"),
            build_catalog_item("yogurt"),
            build_catalog_item("carrot"),
        ],
    }
