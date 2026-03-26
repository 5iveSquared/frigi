from pydantic import BaseModel


class PlayerCreate(BaseModel):
    username: str
    email: str
    password: str


class PlayerLogin(BaseModel):
    email: str
    password: str


class PlayerResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    username: str
    email: str
    elo_rating: float
    total_games: int


class PlayerLevelProgressResponse(BaseModel):
    model_config = {"from_attributes": True}

    level_number: int
    attempts: int
    completions: int
    best_score: int | None
    best_duration_ms: int | None
    best_efficiency_pct: float | None
    stars: int
    first_completed_at: str | None
    last_completed_at: str | None


class DailyProgressResponse(BaseModel):
    level_id: str | None
    daily_date: str | None
    has_attempt: bool
    is_completed: bool
    attempts: int
    best_score: int | None
    completed_at: str | None


class PlayerProgressSummaryResponse(BaseModel):
    completed_levels: int
    current_level_number: int
    total_stars: int
    levels: list[PlayerLevelProgressResponse]
    daily: DailyProgressResponse | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
