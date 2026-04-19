from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    admin_web_origin: str = "http://localhost:3000"
    auth_database_url: str = "sqlite:///./data/auth.db"
    auth_cookie_secure: bool = False
    auth_session_ttl_seconds: int = 86400


@lru_cache
def get_settings() -> Settings:
    return Settings()
