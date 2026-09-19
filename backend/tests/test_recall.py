"""Pure unit tests for Recall helpers (no DB, no network)."""
import json

from app.services.recall import (
    map_bot_status,
    provider_from_url,
    sign_webhook,
    verify_webhook_signature,
)

SECRET = "whsec_dGVzdHNlY3JldA=="  # base64("testsecret")


def test_provider_detection():
    assert provider_from_url("https://meet.google.com/abc-defg-hij") == "google_meet"
    assert provider_from_url("https://us02web.zoom.us/j/123456789") == "zoom"
    assert provider_from_url("https://teams.microsoft.com/l/meetup-join/xyz") == "teams"
    assert provider_from_url("https://example.com/whatever") is None
    assert provider_from_url("not a url") is None


def test_signature_roundtrip_valid():
    body = json.dumps({"event": "bot.status_change"}).encode()
    headers = {
        "svix-id": "msg_1",
        "svix-timestamp": "1700000000",
        "svix-signature": sign_webhook(SECRET, "msg_1", "1700000000", body),
    }
    assert verify_webhook_signature(SECRET, headers, body) is True


def test_signature_rejects_tampered_body():
    body = json.dumps({"event": "bot.status_change"}).encode()
    sig = sign_webhook(SECRET, "msg_1", "1700000000", body)
    tampered = json.dumps({"event": "evil"}).encode()
    headers = {"svix-id": "msg_1", "svix-timestamp": "1700000000", "svix-signature": sig}
    assert verify_webhook_signature(SECRET, headers, tampered) is False


def test_signature_rejects_wrong_secret():
    body = b"{}"
    headers = {
        "svix-id": "msg_1",
        "svix-timestamp": "1700000000",
        "svix-signature": sign_webhook(SECRET, "msg_1", "1700000000", body),
    }
    assert verify_webhook_signature("whsec_d3JvbmdzZWNyZXQ=", headers, body) is False


def test_signature_rejects_missing_headers():
    assert verify_webhook_signature(SECRET, {}, b"{}") is False


def test_status_mapping():
    assert map_bot_status("in_call_recording") == "recording"
    assert map_bot_status("done") == "recording_complete"
    assert map_bot_status("fatal") == "failed"
    assert map_bot_status("something_unknown") is None
