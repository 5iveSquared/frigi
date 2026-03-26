from pydantic import BaseModel


class ScoreResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    session_id: str
    player_id: str
    level_id: str
    total_score: int
    efficiency_score: int
    time_score: int
    constraint_score: int
    move_score: int
    efficiency_pct: float


class LeaderboardEntry(BaseModel):
    rank: int
    player_id: str
    username: str
    total_score: int
    efficiency_pct: float
    duration_ms: int
    created_at: str
