from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_SERVICE_ROOT = Path(__file__).resolve().parent.parent


def resolve_env_files() -> tuple[str, ...]:
    """Load order: .env -> .env.local (later wins). Skip missing files."""
    names = (".env", ".env.local")
    return tuple(str(_SERVICE_ROOT / name) for name in names if (_SERVICE_ROOT / name).is_file())


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=resolve_env_files(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    biz_database_url: str = "sqlite+aiosqlite:///:memory:"
    biz_jwks_url: str = "http://localhost:54321/auth/v1/.well-known/jwks.json"
    biz_cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.biz_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def reset_settings_cache_for_tests() -> None:
    get_settings.cache_clear()
