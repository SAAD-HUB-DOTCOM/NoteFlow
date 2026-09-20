"""Phase 7: recording playback endpoint + mixed-recording extraction (Recall mocked)."""
from app.models import Meeting
from app.services.recall import extract_recording_playback


def test_extract_prefers_video_then_audio_then_processing():
    video = {
        "recordings": [
            {"media_shortcuts": {"video_mixed": {"data": {"download_url": "https://x/v.mp4"}}}}
        ]
    }
    assert extract_recording_playback(video) == {
        "status": "ready", "url": "https://x/v.mp4", "media_type": "video"
    }

    audio = {
        "recordings": [
            {"media_shortcuts": {"audio_mixed": {"data": {"download_url": "https://x/a.mp3"}}}}
        ]
    }
    assert extract_recording_playback(audio)["media_type"] == "audio"

    # Recording exists but media not finalized yet -> processing (never a fake URL).
    processing = {"recordings": [{"media_shortcuts": {"video_mixed": {"data": {}}}}]}
    assert extract_recording_playback(processing) == {
        "status": "processing", "url": None, "media_type": None
    }

    assert extract_recording_playback({"recordings": []})["status"] == "unavailable"


def _seed_meeting(SessionFactory, **fields):
    s = SessionFactory()
    fields.setdefault("owner_user_id", "user-1")
    fields.setdefault("status", "ready")
    fields.setdefault("source", "manual")
    m = Meeting(**fields)
    s.add(m)
    s.commit()
    mid = m.id
    s.close()
    return mid


def test_recording_endpoint_ready(client, SessionFactory):
    mid = _seed_meeting(SessionFactory, recall_bot_id="bot_123", duration_seconds=42)
    r = client.get(f"/api/v1/meetings/{mid}/recording")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ready"
    assert body["media_type"] == "video"
    assert body["url"].startswith("https://recall.example/")
    assert body["duration_seconds"] == 42


def test_recording_endpoint_unavailable_without_bot(client, SessionFactory):
    mid = _seed_meeting(SessionFactory)  # no recall_bot_id
    r = client.get(f"/api/v1/meetings/{mid}/recording")
    assert r.status_code == 200
    assert r.json()["status"] == "unavailable"
    assert r.json()["url"] is None


def test_recording_endpoint_owner_scoped(client, SessionFactory):
    mid = _seed_meeting(SessionFactory, owner_user_id="someone-else", recall_bot_id="bot_123")
    r = client.get(f"/api/v1/meetings/{mid}/recording")
    assert r.status_code == 404
