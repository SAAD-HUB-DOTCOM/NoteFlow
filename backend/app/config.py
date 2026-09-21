from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


def sanitize_db_url(url: str) -> str:
    """Drop Prisma's `?pgbouncer=true` query param — psycopg2/SQLAlchemy must not receive it
    (transaction pooling is handled via engine config / NullPool instead)."""
    parts = urlsplit(url)
    query = [
        (k, v)
        for k, v in parse_qsl(parts.query, keep_blank_values=True)
        if k.lower() != "pgbouncer"
    ]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    frontend_url: str = "http://localhost:3000"

    # Runtime DB connection — Supabase shared TRANSACTION pooler (port 6543).
    # Driver: postgresql+psycopg2://...  (paired with NullPool in app/db.py to avoid double-pooling)
    database_url: str | None = None

    # Migrations DB connection — Supabase shared SESSION pooler (port 5432). Used by Alembic only.
    direct_url: str | None = None

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
