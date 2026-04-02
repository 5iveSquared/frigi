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
