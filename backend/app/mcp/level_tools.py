CREATE_LEVEL_TOOL = {
    "name": "create_level",
    "description": "Create a validated Frigi puzzle level",
    "parameters": {
        "type": "object",
        "required": ["grid", "items", "constraints", "theme", "difficulty"],
        "properties": {
            "grid": {
                "type": "object",
                "required": ["rows", "cols", "cells"],
                "properties": {
                    "rows": {"type": "integer", "minimum": 3, "maximum": 10},
                    "cols": {"type": "integer", "minimum": 3, "maximum": 10},
                    "cells": {
                        "type": "array",
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "row": {"type": "integer"},
                                    "col": {"type": "integer"},
                                    "zone": {
                                        "type": "string",
                                        "enum": ["standard", "cold", "frozen", "shelf"],
                                    },
                                    "occupied": {"type": "boolean"},
                                    "item_id": {"type": ["string", "null"]},
                                },
                            },
                        },
                    },
                },
            },
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["id", "name", "shape", "points", "color"],
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string"},
                        "shape": {
                            "type": "array",
                            "items": {
                                "type": "array",
                                "items": {"type": "integer", "enum": [0, 1]},
                            },
                        },
                        "zone_requirement": {"type": ["string", "null"]},
                        "points": {"type": "integer"},
                        "color": {"type": "string"},
                    },
                },
            },
            "constraints": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "description": {"type": "string"},
                        "points": {"type": "integer"},
                        "type": {"type": "string"},
                        "params": {"type": "object"},
                    },
                },
            },
            "theme": {"type": "string"},
            "difficulty": {"type": "number", "minimum": 0.0, "maximum": 1.0},
        },
    },
}
