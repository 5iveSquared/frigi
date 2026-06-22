import pytest

from app.services.level_generator import LevelGeneratorService


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_normalize_level_data_rejects_duplicate_food_items():
    service = LevelGeneratorService(db=None)

    level_data = {
        "grid": {
            "rows": 4,
            "cols": 4,
            "cells": [
                [
                    {"row": r, "col": c, "zone": "standard", "occupied": False, "itemId": None}
                    for c in range(4)
                ]
                for r in range(4)
            ],
        },
        "items": [
            {"id": "milk", "name": "Milk", "shape": [[1]], "zoneRequirement": "cold", "points": 10, "color": "#fff"},
            {"id": "milk-copy", "name": "Milk", "shape": [[1, 1]], "zoneRequirement": "cold", "points": 12, "color": "#eee"},
            {"id": "cheese", "name": "Cheese", "shape": [[1, 1]], "zoneRequirement": None, "points": 12, "color": "#fc0"},
        ],
        "constraints": [],
        "theme": "kitchen",
        "difficulty": 0.3,
    }

    with pytest.raises(ValueError, match="at least 3 unique items"):
        service._normalize_level_data(level_data)


def test_generate_procedural_level_uses_unique_food_items():
    service = LevelGeneratorService(db=None)

    level_data = service._generate_procedural_level(
        difficulty=0.75,
        theme="grocery",
        player_id="test-player",
        seed_key="unique-food-items",
    )

    item_ids = [item["id"] for item in level_data["items"]]
    item_names = [item["name"].lower() for item in level_data["items"]]

    assert len(item_ids) == len(set(item_ids))
    assert len(item_names) == len(set(item_names))


def test_normalize_level_data_uses_catalog_definition_for_known_foods():
    service = LevelGeneratorService(db=None)

    cells = [
        [
            {"row": r, "col": c, "zone": "standard", "occupied": False, "itemId": None}
            for c in range(4)
        ]
        for r in range(4)
    ]
    level_data = {
        "grid": {"rows": 4, "cols": 4, "cells": cells},
        "items": [
            {"id": "butter", "name": "Butter", "shape": [[1], [1], [1]], "zoneRequirement": None, "points": 99, "color": "#000"},
            {"id": "milk", "name": "Milk", "shape": [[1]], "zoneRequirement": None, "points": 1, "color": "#111"},
            {"id": "cheese", "name": "Cheese", "shape": [[1]], "zoneRequirement": "frozen", "points": 1, "color": "#222"},
        ],
        "constraints": [],
        "theme": "kitchen",
        "difficulty": 0.3,
    }

    normalized = service._normalize_level_data(level_data)
    items = {item["id"]: item for item in normalized["items"]}

    assert items["butter"]["shape"] == [[1]]
    assert items["butter"]["zoneRequirement"] == "shelf"
    assert items["butter"]["points"] == 15
    assert items["milk"]["zoneRequirement"] == "cold"
    assert items["cheese"]["zoneRequirement"] is None


def test_normalize_level_data_preserves_catalog_shape_variants():
    service = LevelGeneratorService(db=None)

    cells = [
        [
            {"row": r, "col": c, "zone": "standard", "occupied": False, "itemId": None}
            for c in range(4)
        ]
        for r in range(4)
    ]
    level_data = {
        "grid": {"rows": 4, "cols": 4, "cells": cells},
        "items": [
            {"id": "butter", "name": "Butter", "shape": [[1, 1]], "zoneRequirement": "shelf", "points": 15, "color": "#FCD34D"},
            {"id": "milk", "name": "Milk", "shape": [[1], [1]], "zoneRequirement": "cold", "points": 30, "color": "#FAFAFA"},
            {"id": "cheese", "name": "Cheese", "shape": [[1, 1]], "zoneRequirement": None, "points": 20, "color": "#F59E0B"},
        ],
        "constraints": [],
        "theme": "kitchen",
        "difficulty": 0.3,
    }

    normalized = service._normalize_level_data(level_data)
    items = {item["id"]: item for item in normalized["items"]}

    assert items["butter"]["shape"] == [[1, 1]]
    assert items["milk"]["shape"] == [[1], [1]]
    assert items["cheese"]["shape"] == [[1, 1]]
