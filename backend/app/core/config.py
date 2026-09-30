"""Konfigurasi aplikasi berbasis environment variable (.env)."""

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Boso Jawa AI"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = (
        "http://localhost:3000,http://localhost:4173,http://localhost:5173"
    )
    database_url: str = (
        "postgresql+psycopg://boso_user:PASSWORD_ANDA@localhost:5432/boso_jawa_db"
    )

    # Gateway LLM OpenAI-compatible. Key WAJIB via .env, jangan pernah
    # hardcode / commit ke repo. Nama lama BAZAARLINK_* masih diterima
    # sebagai alias agar .env lama tidak langsung rusak.
    ai_base_url: str = Field(
        default="https://griphubrouter.web.id/v1",
        validation_alias=AliasChoices("AI_BASE_URL", "BAZAARLINK_BASE_URL"),
    )
    ai_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("AI_API_KEY", "BAZAARLINK_API_KEY"),
    )
    ai_model: str = "deepseek-v4-flash"
    ai_temperature: float = 0.7
    ai_max_tokens: int = 1024
    ai_timeout_seconds: float = 30.0
    ai_max_retries: int = 1
    ai_chat_rate_limit: int = 10
    ai_models_rate_limit: int = 30
    admin_api_key: str = ""
    editor_api_key: str = ""
    reviewer_api_key: str = ""

    # --- Rate limit store (Redis / Upstash) ---
    # Isi salah satu: `redis_url` (TCP/TLS, mis. rediss://...) atau pasangan
    # `upstash_rest_url` + `upstash_rest_token` (REST, berguna di serverless).
    # Kosongkan keduanya untuk memakai penyimpanan in-memory (khusus dev/test).
    redis_url: str = ""
    upstash_rest_url: str = ""
    upstash_rest_token: str = ""
    rate_limit_window_seconds: int = 60
    rate_limit_fallback_memory: bool = True
    rate_limit_connect_timeout: float = 2.0
    rate_limit_socket_timeout: float = 2.0

    # --- Observability ---
    # Sentry DSN untuk error tracking
    sentry_dsn: str = ""
    sentry_environment: str = "development"
    sentry_traces_sample_rate: float = 0.1
    sentry_profiles_sample_rate: float = 0.1

    # Prometheus metrics
    prometheus_metrics_enabled: bool = True
    prometheus_metrics_path: str = "/metrics"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def rate_limit_backend(self) -> str:
        """``"redis"``, ``"upstash"``, atau ``"memory"``."""
        if self.upstash_rest_url and self.upstash_rest_token:
            return "upstash"
        if self.redis_url:
            return "redis"
        return "memory"


settings = Settings()
