"""Konfigurasi aplikasi berbasis environment variable (.env)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Boso Jawa AI"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000"
    database_url: str = (
        "postgresql+psycopg://boso_user:wongjowo@localhost:5432/boso_jawa_db"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
