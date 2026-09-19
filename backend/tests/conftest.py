"""Test fixtures: in-memory SQLite DB + dependency overrides + mocked Recall."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (register models on Base.metadata)
import app.webhooks as webhooks
from app.config import Settings, get_settings
from app.db import Base, get_db
from app.main import app
from app.security import CurrentUser, get_current_user

# base64("testsecret") = "dGVzdHNlY3JldA=="
TEST_WEBHOOK_SECRET = "whsec_dGVzdHNlY3JldA=="


@pytest.fixture()
def SessionFactory():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    yield factory
    Base.metadata.drop_all(engine)


@pytest.fixture()
def test_settings():
    return Settings(
        recall_api_key="test-key",
        recall_region="ap-northeast-1",
        recall_workspace_verification_secret=TEST_WEBHOOK_SECRET,
    )


class _FakeRecall:
    def create_bot(self, meeting_url: str, bot_name: str = "NoteFlow Notetaker") -> dict:
        return {"id": "bot_123"}


@pytest.fixture()
def client(SessionFactory, test_settings, monkeypatch):
    def override_get_db():
        s = SessionFactory()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(id="user-1", email="u@example.com")
    app.dependency_overrides[get_settings] = lambda: test_settings

    # Webhook handler builds its own session + reads settings directly — point both at the test rig.
    monkeypatch.setattr(webhooks, "SessionLocal", SessionFactory)
    monkeypatch.setattr(webhooks, "get_settings", lambda: test_settings)

    # Never hit the network for bot creation.
    monkeypatch.setattr("app.api.get_recall_service", lambda api_key, region: _FakeRecall())

    c = TestClient(app, raise_server_exceptions=True)
    yield c
    app.dependency_overrides.clear()
