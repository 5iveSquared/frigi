from datetime import date

from pydantic import BaseModel, Field


class CellSchema(BaseModel):
    row: int
    col: int
    zone: str = "standard"
    occupied: bool = False
    item_id: str | None = None


class GridSchema(BaseModel):
    rows: int = Field(ge=3, le=10)
    cols: int = Field(ge=3, le=10)
    cells: list[list[CellSchema]]


class ItemSchema(BaseModel):
    id: str
    name: str
    shape: list[list[int]]
    zone_requirement: str | None = None
    points: int
    color: str


class ConstraintSchema(BaseModel):
    id: str
    description: str
    points: int
    type: str
    params: dict = {}


class LevelGenerateRequest(BaseModel):
    difficulty: float = Field(default=0.3, ge=0.0, le=1.0)
    theme: str | None = None


class LevelResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    grid: dict
    items: list
    constraints: list
    theme: str
    difficulty: float
    progression_index: int
    optimal_score: int
    is_daily: bool
    daily_date: date | None
