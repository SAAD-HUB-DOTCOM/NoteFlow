"""Database engine, session, and declarative base (SQLAlchemy 2.x, sync)."""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


_settings = get_settings()
# Engine is created lazily-tolerant: if DATABASE_URL is unset, a placeholder is used so the
# module imports (health works); any real query will fail loudly rather than silently.
_engine = create_engine(
    _settings.database_url or "postgresql+psycopg://placeholder/placeholder",
    pool_pre_ping=True,
    future=True,
)
SessionLocal = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False, class_=Session)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
