from copy import deepcopy


ITEM_CATALOG: dict[str, dict] = {
    "milk": {
        "id": "milk",
        "name": "Milk",
        "shape_variants": [[[1], [1], [1]], [[1], [1]]],
        "zoneRequirement": "cold",
        "points": 30,
        "color": "#FAFAFA",
        "emoji": "🥛",
    },
    "cheese": {
        "id": "cheese",
        "name": "Cheese",
        "shape_variants": [[[1, 1], [1, 0]], [[1, 1]]],
        "zoneRequirement": None,
        "points": 20,
        "color": "#F59E0B",
        "emoji": "🧀",
    },
    "broccoli": {
        "id": "broccoli",
        "name": "Broccoli",
        "shape_variants": [[[0, 1], [1, 1]], [[1, 1], [1, 0]]],
        "zoneRequirement": None,
        "points": 25,
        "color": "#16A34A",
        "emoji": "🥦",
    },
    "butter": {
        "id": "butter",
        "name": "Butter",
        "shape_variants": [[[1]], [[1, 1]]],
        "zoneRequirement": "shelf",
        "points": 15,
        "color": "#FCD34D",
        "emoji": "🧈",
    },
    "yogurt": {
        "id": "yogurt",
        "name": "Yogurt",
        "shape_variants": [[[1, 1], [1, 1]], [[1], [1]]],
        "zoneRequirement": "cold",
        "points": 20,
        "color": "#BAE6FD",
        "emoji": "🫙",
    },
    "carrot": {
        "id": "carrot",
        "name": "Carrot",
        "shape_variants": [[[1], [1]], [[1, 1]]],
        "zoneRequirement": None,
        "points": 10,
        "color": "#F97316",
        "emoji": "🥕",
    },
    "peas": {
        "id": "peas",
        "name": "Peas",
        "shape_variants": [[[1, 1, 1]], [[1, 1]]],
        "zoneRequirement": "frozen",
        "points": 18,
        "color": "#34D399",
        "emoji": "🫛",
    },
    "juice": {
        "id": "juice",
        "name": "Juice",
        "shape_variants": [[[1], [1]], [[1]]],
        "zoneRequirement": "cold",
        "points": 14,
        "color": "#FBBF24",
        "emoji": "🧃",
    },
    "eggs": {
        "id": "eggs",
        "name": "Eggs",
        "shape_variants": [[[1, 1], [1, 1]], [[1, 1]]],
        "zoneRequirement": "shelf",
        "points": 22,
        "color": "#FDE68A",
        "emoji": "🥚",
    },
    "berries": {
        "id": "berries",
        "name": "Berries",
        "shape_variants": [[[1, 1, 0], [0, 1, 1]], [[1, 1], [1, 0]]],
        "zoneRequirement": "cold",
        "points": 28,
        "color": "#FB7185",
        "emoji": "🫐",
    },
    "turkey": {
        "id": "turkey",
        "name": "Turkey",
        "shape_variants": [[[1, 1, 1], [1, 1, 1], [1, 1, 0]], [[1, 1], [1, 1], [1, 1]]],
        "zoneRequirement": None,
        "points": 64,
        "color": "#D97706",
        "emoji": "🦃",
    },
    "pizza-box": {
        "id": "pizza-box",
        "name": "Pizza Box",
        "shape_variants": [[[1, 1, 1, 1]], [[1, 1, 1]]],
        "zoneRequirement": None,
        "points": 32,
        "color": "#FCA5A5",
        "emoji": "🍕",
    },
    "watermelon": {
        "id": "watermelon",
        "name": "Watermelon",
        "shape_variants": [[[1, 1, 1], [1, 1, 1]], [[0, 1, 0], [1, 1, 1]]],
        "zoneRequirement": None,
        "points": 48,
        "color": "#4ADE80",
        "emoji": "🍉",
    },
    "cake": {
        "id": "cake",
        "name": "Cake",
        "shape_variants": [[[1, 1], [1, 1], [1, 0]], [[1, 1], [1, 1]]],
        "zoneRequirement": "cold",
        "points": 46,
        "color": "#F9A8D4",
        "emoji": "🎂",
    },
    "lasagna": {
        "id": "lasagna",
        "name": "Lasagna",
        "shape_variants": [[[1, 1, 1], [1, 0, 0]], [[1, 1], [1, 0], [1, 0]]],
        "zoneRequirement": None,
        "points": 38,
        "color": "#FDBA74",
        "emoji": "🍝",
    },
    "soda-crate": {
        "id": "soda-crate",
        "name": "Soda Crate",
        "shape_variants": [[[1, 1, 1], [0, 1, 0]], [[0, 1], [1, 1], [0, 1]]],
        "zoneRequirement": None,
        "points": 38,
        "color": "#93C5FD",
        "emoji": "🥤",
    },
    "ice-cream": {
        "id": "ice-cream",
        "name": "Ice Cream",
        "shape_variants": [[[1, 1], [1, 1]], [[1, 1]]],
        "zoneRequirement": "frozen",
        "points": 30,
        "color": "#A5F3FC",
        "emoji": "🍦",
    },
    "fish-sticks": {
        "id": "fish-sticks",
        "name": "Fish Sticks",
        "shape_variants": [[[1, 1, 1]], [[1, 1]]],
        "zoneRequirement": "frozen",
        "points": 22,
        "color": "#93C5FD",
        "emoji": "🐟",
    },
}

ITEM_ALIASES = {
    "juice-box": "juice",
    "juicebox": "juice",
    "berry": "berries",
    "strawberries": "berries",
    "strawberry": "berries",
    "egg": "eggs",
}


def normalize_food_key(value: str) -> str:
    return "".join(char if char.isalnum() else "-" for char in value.lower()).strip("-")


def catalog_key_for_item(item: dict) -> str | None:
    for value in (item.get("id"), item.get("name")):
        if not value:
            continue
        key = normalize_food_key(str(value))
        if key in ITEM_CATALOG:
            return key
        if key in ITEM_ALIASES:
            return ITEM_ALIASES[key]
    return None


def build_catalog_item(key: str, variant_index: int = 0) -> dict:
    definition = ITEM_CATALOG[key]
    variants = definition["shape_variants"]
    shape = variants[variant_index % len(variants)]
    return {
        "id": definition["id"],
        "name": definition["name"],
        "shape": deepcopy(shape),
        "zoneRequirement": definition["zoneRequirement"],
        "points": definition["points"],
        "color": definition["color"],
    }


def build_catalog_items(variant_index: int = 0) -> list[dict]:
    return [build_catalog_item(key, variant_index) for key in ITEM_CATALOG]


def normalize_known_item(item: dict) -> dict | None:
    key = catalog_key_for_item(item)
    if key is None:
        return None

    definition = ITEM_CATALOG[key]
    source_shape = item.get("shape")
    for variant_index, variant in enumerate(definition["shape_variants"]):
        if source_shape == variant:
            return build_catalog_item(key, variant_index)
    return build_catalog_item(key)
