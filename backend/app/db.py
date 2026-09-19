"""Database engine, session, and declarative base (SQLAlchemy 2.x, sync)."""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import get_settings, sanitize_db_url


class Base(DeclarativeBase):
    pass


_settings = get_settings()
# Runtime uses Supabase's TRANSACTION pooler (6543), which already pools connections — so we use
# NullPool here to avoid pooling-on-top-of-a-pooler (Supabase's SQLAlchemy recommendation).
# Placeholder keeps the module importable (health works) when DATABASE_URL is unset; a real query
# then fails loudly rather than silently.
_db_url = (
    sanitize_db_url(_settings.database_url)
    if _settings.database_url
    else "postgresql+psycopg2://placeholder/placeholder"
)
_engine = create_engine(_db_url, poolclass=NullPool, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False, class_=Session)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
