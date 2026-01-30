"""Application configuration settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    DATABASE_URL: str
    NEXTAUTH_SECRET: str

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
