"""Alembic environment — targets the app's metadata and migrates via DIRECT_URL.

Migrations must use Supabase's SESSION pooler (DIRECT_URL, port 5432), NOT the runtime
TRANSACTION pooler (DATABASE_URL, port 6543). DATABASE_URL is only a last-resort fallback.
"""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import get_settings, sanitize_db_url
from app.db import Base
import app.models  # noqa: F401  (import for side effect: registers all models on Base.metadata)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

settings = get_settings()
migration_url = settings.direct_url or settings.database_url
if migration_url:
    config.set_main_option("sqlalchemy.url", sanitize_db_url(migration_url))

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
