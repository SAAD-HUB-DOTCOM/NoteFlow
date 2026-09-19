"""Application settings loaded from environment (pydantic-settings).

Secrets are Optional so the API boots for /health even before external services are
configured; protected routes fail with a truthful "not configured" error rather than
faking success (per note-flow.md §0).
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    frontend_url: str = "http://localhost:3000"

    # Database (Supabase Postgres). Sync driver: postgresql+psycopg://...
    database_url: str | None = None

    # Supabase
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_jwt_audience: str = "authenticated"

    # Recall.ai
    recall_api_key: str | None = None
    recall_region: str = "ap-northeast-1"
    recall_workspace_verification_secret: str | None = None

    # Groq
    groq_api_key: str | None = None
    groq_model: str = "openai/gpt-oss-120b"

    # AssemblyAI (only if NoteFlow calls it directly; normally configured inside Recall)
    assemblyai_api_key: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
