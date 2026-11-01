from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven settings (also read from backend/.env)."""

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    DATABASE_URL: str = 'postgresql://creator:creator@localhost:5433/creator'
    DATABASE_SCHEMA: str = 'creator'

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        # same URL psql/psycopg use; SQLAlchemy needs the driver named
        return self.DATABASE_URL.replace('postgresql://', 'postgresql+psycopg://', 1)

    FASTAPI_TITLE: str = 'Tidemark API'
    FASTAPI_API_V1_PATH: str = '/api/v1'

    CORS_ORIGIN_REGEX: str = r'https?://(localhost|127\.0\.0\.1)(:\d+)?'


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
