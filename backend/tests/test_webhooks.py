"""Webhook receiver tests: signature, idempotency, status mapping, truthful failure."""
import json

from app.config import Settings
from app.models import Meeting, WebhookEvent
from app.services.recall import sign_webhook
from tests.conftest import TEST_WEBHOOK_SECRET


def _seed_meeting(SessionFactory, bot_id="bot_123", status="joining"):
    s = SessionFactory()
    m = Meeting(owner_user_id="user-1", recall_bot_id=bot_id, status=status, source="manual")
    s.add(m)
    s.commit()
    mid = m.id
    s.close()
    return mid


def _signed(body: dict, msg_id="msg_1"):
    raw = json.dumps(body).encode()
    ts = "1700000000"
    headers = {
        # Current Recall header standard (webhook-*); the verifier also accepts legacy svix-*.
        "webhook-id": msg_id,
        "webhook-timestamp": ts,
        "webhook-signature": sign_webhook(TEST_WEBHOOK_SECRET, msg_id, ts, raw),
        "content-type": "application/json",
    }
    return raw, headers


def test_valid_webhook_updates_status(client, SessionFactory):
    mid = _seed_meeting(SessionFactory)
    body = {"event": "bot.status_change", "data": {"bot_id": "bot_123", "status": {"code": "in_call_recording"}}}
    raw, headers = _signed(body)
    r = client.post("/webhooks/recall", content=raw, headers=headers)
    assert r.status_code == 200, r.text

    s = SessionFactory()
    assert s.get(Meeting, mid).status == "recording"
    s.close()


def test_webhook_idempotent_on_duplicate_event(client, SessionFactory):
    _seed_meeting(SessionFactory)
    body = {"event": "bot.status_change", "data": {"bot_id": "bot_123", "status": {"code": "done"}}}
    raw, headers = _signed(body, msg_id="dup_1")

    assert client.post("/webhooks/recall", content=raw, headers=headers).status_code == 200
    assert client.post("/webhooks/recall", content=raw, headers=headers).status_code == 200

    s = SessionFactory()
    count = s.query(WebhookEvent).filter(WebhookEvent.external_event_id == "dup_1").count()
    s.close()
    assert count == 1  # duplicate delivery recorded once


def test_webhook_rejects_invalid_signature(client, SessionFactory):
    _seed_meeting(SessionFactory)
    raw = json.dumps({"event": "x"}).encode()
    headers = {
        "webhook-id": "msg_2",
        "webhook-timestamp": "1700000000",
        "webhook-signature": "v1,not-a-real-signature",
        "content-type": "application/json",
    }
    r = client.post("/webhooks/recall", content=raw, headers=headers)
    assert r.status_code == 401


def test_webhook_503_when_secret_unconfigured(client, monkeypatch):
    import app.webhooks as webhooks

    monkeypatch.setattr(webhooks, "get_settings", lambda: Settings(recall_workspace_verification_secret=None))
    raw = json.dumps({"event": "x"}).encode()
    headers = {"svix-id": "m", "svix-timestamp": "1", "svix-signature": "v1,x", "content-type": "application/json"}
    r = client.post("/webhooks/recall", content=raw, headers=headers)
    assert r.status_code == 503
