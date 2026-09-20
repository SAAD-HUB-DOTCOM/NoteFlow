"""Phase 4 tests: transcript normalization, idempotent jobs, webhook flow, read endpoint."""
import json

import app.services.transcription as tx
import app.webhooks as webhooks
from app.models import Job, Meeting, TranscriptSegment
from app.services.recall import sign_webhook
from app.services.transcription import (
    extract_download_url,
    normalize_transcript,
    run_create_transcript,
    run_process_transcript,
)
from tests.conftest import TEST_WEBHOOK_SECRET

RECALL_TRANSCRIPT = [
    {
        "speaker": "Alice",
        "words": [
            {"text": "Hi", "start_timestamp": {"relative": 0.5}, "end_timestamp": {"relative": 0.8}},
            {"text": "there", "start_timestamp": {"relative": 0.8}, "end_timestamp": {"relative": 1.2}},
        ],
    },
    {
        "speaker": 1,
        "words": [
            {"text": "Hello", "start_timestamp": {"relative": 1.5}, "end_timestamp": {"relative": 2.0}},
        ],
    },
]


class _FakeRecall:
    def __init__(self):
        self.created_for = None

    def create_transcript(self, recording_id):
        self.created_for = recording_id
        return {"id": "tr_new"}

    def get_transcript(self, transcript_id):
        return {"id": transcript_id, "data": {"download_url": "https://dl.example/x"}}

    def download_transcript(self, url):
        return RECALL_TRANSCRIPT

    def get_bot(self, bot_id):
        """Shape confirmed against the real Recall API (GET /bot/{id}/)."""
        return {
            "id": bot_id,
            "recordings": [
                {
                    "id": "rec_from_bot",
                    "started_at": "2026-09-20T06:56:12.974512Z",
                    "completed_at": "2026-09-20T06:56:36.489678Z",
                    "media_shortcuts": {
                        "transcript": {"id": "tr_from_bot", "data": {"download_url": "https://dl.example/x"}}
                    },
                }
            ],
        }


# ── normalization (pure) ──────────────────────────────────────────────────────

def test_normalize_transcript_shapes():
    segs = normalize_transcript(RECALL_TRANSCRIPT)
    assert len(segs) == 2
    assert segs[0] == {
        "speaker_label": "Alice", "text": "Hi there",
        "start_ms": 500, "end_ms": 1200, "sequence": 0, "source": "assembly_ai_async",
    }
    assert segs[1]["speaker_label"] == "Speaker 1"
    assert segs[1]["start_ms"] == 1500 and segs[1]["end_ms"] == 2000 and segs[1]["sequence"] == 1


def test_normalize_handles_wrapped_and_empty():
    assert normalize_transcript({"transcript": RECALL_TRANSCRIPT})  # wrapped list
    assert normalize_transcript({}) == []
    assert normalize_transcript([{"speaker": "X", "words": []}]) == []  # no text dropped


def test_extract_download_url():
    assert extract_download_url({"data": {"download_url": "u"}}) == "u"
    assert extract_download_url({"download_url": "u2"}) == "u2"
    assert extract_download_url({}) is None


def test_create_transcript_requests_perfect_diarization(monkeypatch):
    """The async transcript request uses Perfect Diarization (real participant names), not
    assembly_ai_async.speaker_labels (generic A/B/C)."""
    import app.services.recall as recallmod

    captured: dict = {}

    class _Resp:
        def raise_for_status(self):
            return None

        def json(self):
            return {"id": "tr"}

    class _Client:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def post(self, url, json=None, headers=None):
            captured["url"] = url
            captured["json"] = json
            return _Resp()

    monkeypatch.setattr(recallmod.httpx, "Client", _Client)
    recallmod.RecallService("key", "ap-northeast-1").create_transcript("rec_1")

    assert captured["url"].endswith("/recording/rec_1/create_transcript/")
    assert captured["json"] == {
        "provider": {"assembly_ai_async": {}},
        "diarization": {"use_separate_streams_when_available": True},
    }


# ── job runners (idempotent, no network) ───────────────────────────────────────

def _seed_meeting(SessionFactory, **fields):
    fields.setdefault("status", "recording")
    fields.setdefault("source", "manual")
    s = SessionFactory()
    m = Meeting(owner_user_id="user-1", **fields)
    s.add(m)
    s.commit()
    mid = m.id
    s.close()
    return mid


def test_run_create_transcript_uses_recording_id(SessionFactory, monkeypatch):
    mid = _seed_meeting(SessionFactory, recall_recording_id="rec_5", recall_bot_id="bot_1")
    fake = _FakeRecall()
    monkeypatch.setattr(tx, "SessionLocal", SessionFactory)
    monkeypatch.setattr(tx, "get_recall_service", lambda k, r: fake)
    s = SessionFactory(); s.add(Job(meeting_id=mid, type="create_transcript", status="pending")); s.commit(); s.close()

    run_create_transcript(mid)

    assert fake.created_for == "rec_5"  # recording id, NOT the bot id
    s = SessionFactory()
    assert s.query(Job).filter_by(meeting_id=mid, type="create_transcript").one().status == "succeeded"
    s.close()


def test_run_create_transcript_reconciles_missing_recording_id(SessionFactory, monkeypatch):
    """Real recording.done payloads may omit the recording id — the job must reconcile it from
    the bot object (this was the production defect: jobs never ran, meetings stuck transcribing)."""
    mid = _seed_meeting(SessionFactory, recall_bot_id="bot_9", recall_recording_id=None)
    fake = _FakeRecall()
    monkeypatch.setattr(tx, "SessionLocal", SessionFactory)
    monkeypatch.setattr(tx, "get_recall_service", lambda k, r: fake)
    s = SessionFactory(); s.add(Job(meeting_id=mid, type="create_transcript", status="pending")); s.commit(); s.close()

    tx.run_create_transcript(mid)

    s = SessionFactory()
    m = s.get(Meeting, mid)
    assert m.recall_recording_id == "rec_from_bot"
    assert m.started_at is not None and m.ended_at is not None
    assert m.duration_seconds == 23  # 06:56:12.97 -> 06:56:36.48
    s.close()
    assert fake.created_for == "rec_from_bot"


def test_run_process_transcript_reconciles_missing_transcript_id(SessionFactory, monkeypatch):
    mid = _seed_meeting(SessionFactory, recall_bot_id="bot_10", recall_transcript_id=None, status="transcribing")
    monkeypatch.setattr(tx, "SessionLocal", SessionFactory)
    monkeypatch.setattr(tx, "get_recall_service", lambda k, r: _FakeRecall())
    s = SessionFactory(); s.add(Job(meeting_id=mid, type="process_transcript", status="pending")); s.commit(); s.close()

    tx.run_process_transcript(mid)

    s = SessionFactory()
    m = s.get(Meeting, mid)
    assert m.recall_transcript_id == "tr_from_bot"
    assert m.status == "ready"
    assert s.query(TranscriptSegment).filter_by(meeting_id=mid).count() == 2
    s.close()


def test_run_process_transcript_persists_and_is_idempotent(SessionFactory, monkeypatch):
    mid = _seed_meeting(SessionFactory, recall_transcript_id="tr_1", status="transcribing")
    monkeypatch.setattr(tx, "SessionLocal", SessionFactory)
    monkeypatch.setattr(tx, "get_recall_service", lambda k, r: _FakeRecall())
    s = SessionFactory(); s.add(Job(meeting_id=mid, type="process_transcript", status="pending")); s.commit(); s.close()

    run_process_transcript(mid)
    run_process_transcript(mid)  # second run must not duplicate

    s = SessionFactory()
    segs = s.query(TranscriptSegment).filter_by(meeting_id=mid).order_by(TranscriptSegment.sequence).all()
    assert len(segs) == 2
    assert segs[0].text == "Hi there" and segs[0].speaker_label == "Alice"
    assert s.get(Meeting, mid).status == "ready"
    s.close()


# ── webhook flow ───────────────────────────────────────────────────────────────

def _signed(body, msg_id="m1"):
    raw = json.dumps(body).encode()
    ts = "1700000000"
    return raw, {
        "webhook-id": msg_id,
        "webhook-timestamp": ts,
        "webhook-signature": sign_webhook(TEST_WEBHOOK_SECRET, msg_id, ts, raw),
        "content-type": "application/json",
    }


def test_recording_done_persists_recording_id_times_and_enqueues(client, SessionFactory, monkeypatch):
    mid = _seed_meeting(SessionFactory, recall_bot_id="bot_abc", status="recording")
    calls = []
    monkeypatch.setattr(webhooks, "run_create_transcript", lambda meeting_id: calls.append(meeting_id))

    body = {
        "event": "recording.done",
        "data": {
            "bot_id": "bot_abc",
            "recording": {
                "id": "rec_777",
                "started_at": "2026-09-20T01:00:00Z",
                "completed_at": "2026-09-20T01:02:30Z",
            },
        },
    }
    raw, headers = _signed(body, "rec-evt-1")
    assert client.post("/webhooks/recall", content=raw, headers=headers).status_code == 200

    s = SessionFactory()
    m = s.get(Meeting, mid)
    assert m.recall_recording_id == "rec_777"  # recording id, not bot id
    assert m.recall_recording_id != "bot_abc"
    assert m.status == "transcribing"
    assert m.started_at is not None and m.ended_at is not None
    assert m.duration_seconds == 150
    assert s.query(Job).filter_by(meeting_id=mid, type="create_transcript").count() == 1
    s.close()
    assert calls == [mid]


def test_recording_done_duplicate_delivery_enqueues_once(client, SessionFactory, monkeypatch):
    mid = _seed_meeting(SessionFactory, recall_bot_id="bot_dup", status="recording")
    calls = []
    monkeypatch.setattr(webhooks, "run_create_transcript", lambda meeting_id: calls.append(meeting_id))
    body = {"event": "recording.done", "data": {"bot_id": "bot_dup", "recording": {"id": "rec_d"}}}

    raw1, h1 = _signed(body, "dup-a")
    raw2, h2 = _signed(body, "dup-b")  # different event id, same content
    assert client.post("/webhooks/recall", content=raw1, headers=h1).status_code == 200
    assert client.post("/webhooks/recall", content=raw2, headers=h2).status_code == 200

    s = SessionFactory()
    assert s.query(Job).filter_by(meeting_id=mid, type="create_transcript").count() == 1
    s.close()
    assert calls == [mid]  # scheduled exactly once


def test_transcript_done_persists_transcript_id_and_enqueues(client, SessionFactory, monkeypatch):
    mid = _seed_meeting(SessionFactory, recall_bot_id="bot_t", recall_recording_id="rec_t", status="transcribing")
    calls = []
    monkeypatch.setattr(webhooks, "run_process_transcript", lambda meeting_id: calls.append(meeting_id))
    body = {"event": "transcript.done", "data": {"bot_id": "bot_t", "transcript": {"id": "tr_42"}}}
    raw, headers = _signed(body, "tr-done-1")
    assert client.post("/webhooks/recall", content=raw, headers=headers).status_code == 200

    s = SessionFactory()
    assert s.get(Meeting, mid).recall_transcript_id == "tr_42"
    assert s.query(Job).filter_by(meeting_id=mid, type="process_transcript").count() == 1
    s.close()
    assert calls == [mid]


def test_real_event_names_drive_status(client, SessionFactory):
    """Live Recall events are named bot.<code> with data.data.code — status must map from them
    (this was why the UI stayed stuck on 'joining' during a real call)."""
    mid = _seed_meeting(SessionFactory, recall_bot_id="bot_live", status="joining")
    flow = [
        ("bot.in_waiting_room", "in_waiting_room"),
        ("bot.in_call_recording", "recording"),
        ("bot.call_ended", "recording_complete"),
    ]
    for i, (event, expected) in enumerate(flow):
        body = {"event": event, "data": {"data": {"code": event[4:]}, "bot": {"id": "bot_live"}}}
        raw, headers = _signed(body, f"live-{i}")
        assert client.post("/webhooks/recall", content=raw, headers=headers).status_code == 200
        s = SessionFactory()
        assert s.get(Meeting, mid).status == expected, event
        s.close()


def test_capture_sets_default_title(client):
    r = client.post("/api/v1/meetings/capture", json={"meeting_url": "https://meet.google.com/abc-defg-hij"})
    assert r.status_code == 200, r.text
    assert r.json()["title"] == "Google Meet meeting"


def test_reprocess_endpoint_forces_pipeline(client, SessionFactory, monkeypatch):
    import app.api as apimod
    mid = _seed_meeting(SessionFactory, recall_bot_id="bot_r", status="failed")
    calls = []
    monkeypatch.setattr(apimod, "run_create_transcript", lambda meeting_id: calls.append(meeting_id))
    # pre-existing failed job must not block reprocess (force=True path)
    s = SessionFactory(); s.add(Job(meeting_id=mid, type="create_transcript", status="failed")); s.commit(); s.close()

    r = client.post(f"/api/v1/meetings/{mid}/reprocess")
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "transcribing"
    assert calls == [mid]
    s = SessionFactory()
    assert s.query(Job).filter_by(meeting_id=mid, type="create_transcript").one().status == "pending"
    s.close()


def test_transcript_failed_sets_failure(client, SessionFactory):
    mid = _seed_meeting(SessionFactory, recall_bot_id="bot_f", status="transcribing")
    body = {"event": "transcript.failed", "data": {"bot_id": "bot_f", "error": "assemblyai boom"}}
    raw, headers = _signed(body, "tr-fail-1")
    assert client.post("/webhooks/recall", content=raw, headers=headers).status_code == 200
    s = SessionFactory()
    m = s.get(Meeting, mid)
    assert m.status == "failed"
    assert "boom" in (m.processing_error_message or "")
    s.close()


# ── read endpoint ───────────────────────────────────────────────────────────────

def test_transcript_endpoint_200_empty_while_processing(client, SessionFactory):
    """An existing meeting with no segments yet returns 200 + empty segments (NOT 404), so the
    workspace opens while transcribing."""
    mid = _seed_meeting(SessionFactory, status="transcribing")
    r = client.get(f"/api/v1/meetings/{mid}/transcript")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body == {"meeting_id": mid, "status": "transcribing", "segments": []}


def test_recording_done_extracts_flat_recording_id(client, SessionFactory, monkeypatch):
    """Broadened extraction also handles data.recording_id (flat) shape."""
    mid = _seed_meeting(SessionFactory, recall_bot_id="bot_flat", status="recording")
    monkeypatch.setattr(webhooks, "run_create_transcript", lambda meeting_id: None)
    body = {"event": "recording.done", "data": {"bot_id": "bot_flat", "recording_id": "rec_flat"}}
    raw, headers = _signed(body, "flat-1")
    assert client.post("/webhooks/recall", content=raw, headers=headers).status_code == 200
    s = SessionFactory()
    assert s.get(Meeting, mid).recall_recording_id == "rec_flat"
    s.close()


def test_get_meeting_transcript_endpoint(client, SessionFactory):
    mid = _seed_meeting(SessionFactory, status="ready")
    s = SessionFactory()
    s.add(TranscriptSegment(meeting_id=mid, speaker_label="Alice", text="Hi there",
                            start_ms=500, end_ms=1200, sequence=0, source="assembly_ai_async"))
    s.add(TranscriptSegment(meeting_id=mid, speaker_label="Speaker 1", text="Hello",
                            start_ms=1500, end_ms=2000, sequence=1, source="assembly_ai_async"))
    s.commit(); s.close()

    r = client.get(f"/api/v1/meetings/{mid}/transcript")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "ready"
    assert [seg["text"] for seg in body["segments"]] == ["Hi there", "Hello"]
    assert body["segments"][0]["start"] == 0.5 and body["segments"][0]["end"] == 1.2
    assert body["segments"][1]["speaker"] == "Speaker 1"
