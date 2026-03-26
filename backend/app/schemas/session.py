from datetime import datetime

from pydantic import BaseModel


class SessionCreate(BaseModel):
    level_id: str


class SessionComplete(BaseModel):
    final_placement: dict
    duration_ms: int
    move_count: int = 0


class SessionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    player_id: str
    level_id: str
    status: str
    duration_ms: int | None
    move_count: int
    final_placement: dict | None
    started_at: datetime
    completed_at: datetime | None
