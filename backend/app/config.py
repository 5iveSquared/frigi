from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://frigi:frigi_dev@localhost:5433/frigi"
    db_schema: str = "frigi"
    redis_url: str = "redis://localhost:6379/0"
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
