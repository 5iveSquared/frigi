from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # Resolved relative to this file, not the process's CWD — uvicorn's
    # --app-dir only affects sys.path, not the OS working directory, so a
    # relative ".env" here silently misses backend/.env whenever the process
    # is launched from anywhere else (e.g. the repo root).
    model_config = SettingsConfigDict(env_file=str(_BACKEND_ENV_FILE), extra="ignore")

    database_url: str = "postgresql+asyncpg://frigi:frigi_dev@localhost:5433/frigi"
    db_schema: str = "frigi"
    openai_api_key: str = ""
    openai_timeout_seconds: float = 12.0
    secret_key: str = "dev-secret-key"
    access_token_expire_minutes: int = 10080  # 7 days
    debug: bool = False
    log_level: str = "info"

    @field_validator("debug", mode="before")
    @classmethod
    def normalize_debug(cls, value):
        if isinstance(value, bool) or value is None:
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "development", "dev"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "production", "prod"}:
                return False
        return value

    @property
    def postgres_connect_args(self) -> dict[str, object]:
        if not self.database_url.startswith("postgresql+asyncpg"):
            return {}
        return {
            "server_settings": {
                "search_path": f"{self.db_schema},public",
            }
        }


settings = Settings()
