"""Capture endpoint tests (Recall mocked)."""


def test_capture_creates_meeting_with_bot(client):
    r = client.post(
        "/api/v1/meetings/capture",
        json={"meeting_url": "https://meet.google.com/abc-defg-hij", "title": "Standup"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["provider"] == "google_meet"
    assert body["recall_bot_id"] == "bot_123"
    assert body["status"] == "joining"
    assert body["title"] == "Standup"


def test_capture_rejects_unsupported_url(client):
    r = client.post("/api/v1/meetings/capture", json={"meeting_url": "https://example.com/x"})
    assert r.status_code == 422


def test_capture_not_configured_returns_503(client, monkeypatch):
    from app.services.recall import RecallNotConfigured

    def raise_unconfigured(api_key, region):
        raise RecallNotConfigured()

    monkeypatch.setattr("app.api.get_recall_service", raise_unconfigured)
    r = client.post(
        "/api/v1/meetings/capture",
        json={"meeting_url": "https://meet.google.com/abc-defg-hij"},
    )
    assert r.status_code == 503


def test_meeting_appears_in_list_and_detail(client):
    created = client.post(
        "/api/v1/meetings/capture",
        json={"meeting_url": "https://us02web.zoom.us/j/999"},
    ).json()
    lst = client.get("/api/v1/meetings")
    assert lst.status_code == 200
    ids = [m["id"] for m in lst.json()]
    assert created["id"] in ids
    detail = client.get(f"/api/v1/meetings/{created['id']}")
    assert detail.status_code == 200
    assert detail.json()["provider"] == "zoom"
