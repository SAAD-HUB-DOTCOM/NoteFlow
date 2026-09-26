"""Phase 6B tests: observed MeetingParticipants from the Recall artifact, segment linking, and
the invariants that protect transcription provenance (speaker_label immutable, ingestion never
fails on incomplete identity metadata, no Person invented from a bare name, owner isolation)."""
import app.services.transcription as tx
from app.models import Job, Meeting, MeetingParticipant, Person, TranscriptSegment
from app.services.transcription import (
    _entry_participant,
    _participant_key,
    _sync_participants,
    normalize_with_participants,
    run_process_transcript,
)


def _words(texts, t0=0.0):
    words, t = [], t0
    for w in texts:
        words.append({"text": w, "start_timestamp": {"relative": t}, "end_timestamp": {"relative": t + 0.4}})
        t += 0.5
    return words


# Real Recall async (Perfect Diarization) shape: participant.id + participant.name per turn.
PARTICIPANT_PAYLOAD = [
    {"participant": {"id": 100, "name": "Saad Ullah", "is_host": True}, "words": _words(["Hello", "everyone"])},
    {"participant": {"id": 200, "name": "Sarah Chen"}, "words": _words(["Thanks", "for", "joining"], t0=5.0)},
]


class _FakeRecall:
    def __init__(self, payload):
        self._payload = payload

    def get_transcript(self, transcript_id):
        return {"id": transcript_id, "data": {"download_url": "https://dl.example/x"}}

    def download_transcript(self, url):
        return self._payload


def _seed(SessionFactory, **fields):
    fields.setdefault("status", "transcribing")
    fields.setdefault("source", "manual")
    fields.setdefault("recall_transcript_id", "tr_1")
    s = SessionFactory()
    m = Meeting(owner_user_id=fields.pop("owner_user_id", "user-1"), **fields)
    s.add(m)
    s.commit()
    mid = m.id
    s.close()
    return mid


def _run(SessionFactory, monkeypatch, payload, **fields):
    mid = _seed(SessionFactory, **fields)
    monkeypatch.setattr(tx, "SessionLocal", SessionFactory)
    monkeypatch.setattr(tx, "get_recall_service", lambda k, r: _FakeRecall(payload))
    monkeypatch.setattr("app.services.intelligence.generate_intelligence", lambda meeting_id: None)
    s = SessionFactory(); s.add(Job(meeting_id=mid, type="process_transcript", status="pending")); s.commit(); s.close()
    run_process_transcript(mid)
    return mid


# ── pure metadata extraction ─────────────────────────────────────────────────────

def test_extract_metadata_preserves_id_and_name():
    meta = _entry_participant({"participant": {"id": 100, "name": "Saad Ullah"}})
    assert meta == {"provider_participant_id": "100", "display_name": "Saad Ullah", "email": None}


def test_extract_metadata_missing_id():
    meta = _entry_participant({"participant": {"name": "Sarah"}})
    assert meta["provider_participant_id"] is None and meta["display_name"] == "Sarah"


def test_extract_metadata_missing_name():
    meta = _entry_participant({"participant": {"id": 42}})
    assert meta["provider_participant_id"] == "42" and meta["display_name"] is None


def test_extract_metadata_never_fabricates_email():
    assert _entry_participant({"participant": {"id": 1, "name": "A"}})["email"] is None


def test_normalize_with_participants_is_parallel_and_labels_match():
    segs, metas = normalize_with_participants(PARTICIPANT_PAYLOAD)
    assert len(segs) == len(metas) >= 2
    # Every meta lines up with its segment's raw label.
    for seg, meta in zip(segs, metas):
        assert meta["speaker_label"] == seg["speaker_label"]
    assert metas[0]["provider_participant_id"] == "100" and metas[0]["display_name"] == "Saad Ullah"


def test_participant_key_prefers_provider_id_then_label():
    assert _participant_key({"provider_participant_id": "7", "speaker_label": "X"}) == "pid:7"
    assert _participant_key({"provider_participant_id": None, "speaker_label": "X"}) == "label:X"
    assert _participant_key({"provider_participant_id": None, "speaker_label": None}) is None


# ── ingestion creates observed participants ───────────────────────────────────────

def test_creates_participants_from_real_shape(SessionFactory, monkeypatch):
    mid = _run(SessionFactory, monkeypatch, PARTICIPANT_PAYLOAD, provider="google_meet")
    s = SessionFactory()
    parts = s.query(MeetingParticipant).filter_by(meeting_id=mid).all()
    assert len(parts) == 2
    by_pid = {p.provider_participant_id: p for p in parts}
    assert by_pid["100"].display_name == "Saad Ullah"
    assert by_pid["200"].display_name == "Sarah Chen"
    assert by_pid["100"].provider == "google_meet"  # provider context captured
    assert all(p.person_id is None for p in parts)  # 6B never resolves identity
    s.close()


def test_speaker_n_fallback_participant(SessionFactory, monkeypatch):
    payload = [{"speaker": 1, "words": _words(["Testing"])}]
    mid = _run(SessionFactory, monkeypatch, payload)
    s = SessionFactory()
    p = s.query(MeetingParticipant).filter_by(meeting_id=mid).one()
    assert p.provider_participant_id is None
    assert p.display_name is None  # no real name → not fabricated
    assert p.speaker_label == "Speaker 1"
    s.close()


def test_name_only_participant_keyed_by_label(SessionFactory, monkeypatch):
    payload = [{"participant": {"name": "Guest"}, "words": _words(["Hi", "all"])}]
    mid = _run(SessionFactory, monkeypatch, payload)
    s = SessionFactory()
    p = s.query(MeetingParticipant).filter_by(meeting_id=mid).one()
    assert p.provider_participant_id is None and p.display_name == "Guest" and p.speaker_label == "Guest"
    s.close()


def test_duplicate_display_names_do_not_collapse(SessionFactory, monkeypatch):
    """Two distinct people who share a display name but have distinct provider ids stay TWO rows."""
    payload = [
        {"participant": {"id": 1, "name": "Sarah"}, "words": _words(["First"])},
        {"participant": {"id": 2, "name": "Sarah"}, "words": _words(["Second"], t0=3.0)},
    ]
    mid = _run(SessionFactory, monkeypatch, payload)
    s = SessionFactory()
    parts = s.query(MeetingParticipant).filter_by(meeting_id=mid).all()
    assert len(parts) == 2
    assert {p.provider_participant_id for p in parts} == {"1", "2"}
    s.close()


# ── segment linking + provenance invariants ───────────────────────────────────────

def test_segments_link_to_correct_participant(SessionFactory, monkeypatch):
    mid = _run(SessionFactory, monkeypatch, PARTICIPANT_PAYLOAD)
    s = SessionFactory()
    segs = s.query(TranscriptSegment).filter_by(meeting_id=mid).order_by(TranscriptSegment.sequence).all()
    assert segs and all(seg.meeting_participant_id is not None for seg in segs)
    for seg in segs:
        # The linked participant's label matches the segment's own raw label.
        p = s.get(MeetingParticipant, seg.meeting_participant_id)
        assert p.meeting_id == mid and p.speaker_label == seg.speaker_label
    s.close()


def test_speaker_label_never_overwritten(SessionFactory, monkeypatch):
    mid = _run(SessionFactory, monkeypatch, PARTICIPANT_PAYLOAD)
    s = SessionFactory()
    labels = [seg.speaker_label for seg in
              s.query(TranscriptSegment).filter_by(meeting_id=mid).order_by(TranscriptSegment.sequence).all()]
    assert labels[0] == "Saad Ullah" and "Sarah Chen" in labels  # raw label intact after linking
    s.close()


def test_ingestion_succeeds_when_participant_sync_fails(SessionFactory, monkeypatch):
    """Participant processing must NEVER break transcript ingestion. If sync blows up, the
    transcript still persists and segments simply stay unlinked."""
    def boom(*a, **k):
        raise RuntimeError("identity subsystem down")
    monkeypatch.setattr(tx, "_sync_participants", boom)
    mid = _run(SessionFactory, monkeypatch, PARTICIPANT_PAYLOAD)
    s = SessionFactory()
    segs = s.query(TranscriptSegment).filter_by(meeting_id=mid).all()
    assert len(segs) >= 2 and all(seg.meeting_participant_id is None for seg in segs)
    assert s.query(MeetingParticipant).filter_by(meeting_id=mid).count() == 0
    assert s.get(Meeting, mid).status == "ready"  # ingestion succeeded regardless
    s.close()


def test_unresolvable_participant_leaves_segment_unlinked(SessionFactory, monkeypatch):
    """An entry with neither id, name, nor speaker can't key a participant — the segment still
    persists (unlinked). Uses a {text,start,end} entry with no speaker of any kind."""
    payload = [{"text": "Anonymous line", "start": 0.0, "end": 1.0}]
    mid = _run(SessionFactory, monkeypatch, payload)
    s = SessionFactory()
    seg = s.query(TranscriptSegment).filter_by(meeting_id=mid).one()
    assert seg.speaker_label is None and seg.meeting_participant_id is None
    assert s.query(MeetingParticipant).filter_by(meeting_id=mid).count() == 0
    s.close()


# ── idempotency ────────────────────────────────────────────────────────────────

def test_reprocessing_is_idempotent(SessionFactory, monkeypatch):
    mid = _run(SessionFactory, monkeypatch, PARTICIPANT_PAYLOAD)
    # Second full run: segments already present → early return, no duplicate participants.
    run_process_transcript(mid)
    s = SessionFactory()
    assert s.query(MeetingParticipant).filter_by(meeting_id=mid).count() == 2
    assert s.query(TranscriptSegment).filter_by(meeting_id=mid).count() == 2
    s.close()


def test_sync_participants_get_or_create_idempotent(SessionFactory):
    """Calling _sync_participants twice for the same meeting must not duplicate rows."""
    s = SessionFactory()
    m = Meeting(owner_user_id="user-1", source="manual", provider="zoom")
    s.add(m); s.commit()
    _, metas = normalize_with_participants(PARTICIPANT_PAYLOAD)
    first = _sync_participants(s, m, metas); s.commit()
    second = _sync_participants(s, m, metas); s.commit()
    assert first == second  # same keys → same ids
    assert s.query(MeetingParticipant).filter_by(meeting_id=m.id).count() == 2
    s.close()


# ── historical data + Person discipline + owner isolation ─────────────────────────

def test_historical_segment_rows_remain_valid(SessionFactory):
    """Pre-6B segments (no participant link) stay valid: null FK, still queryable."""
    s = SessionFactory()
    m = Meeting(owner_user_id="user-1", source="manual", status="ready")
    s.add(m); s.commit()
    s.add(TranscriptSegment(meeting_id=m.id, speaker_label="Alice", text="Hi",
                            start_ms=0, end_ms=500, sequence=0, source="assembly_ai_async"))
    s.commit()
    seg = s.query(TranscriptSegment).filter_by(meeting_id=m.id).one()
    assert seg.meeting_participant_id is None and seg.speaker_label == "Alice"
    s.close()


def test_no_person_created_from_bare_name(SessionFactory, monkeypatch):
    _run(SessionFactory, monkeypatch, PARTICIPANT_PAYLOAD)
    s = SessionFactory()
    assert s.query(Person).count() == 0  # observation ≠ identity; 6B never invents a Person
    s.close()


def test_owner_isolation_between_meetings(SessionFactory, monkeypatch):
    a = _run(SessionFactory, monkeypatch, PARTICIPANT_PAYLOAD, owner_user_id="owner-A")
    b = _run(SessionFactory, monkeypatch,
             [{"participant": {"id": 900, "name": "Other Person"}, "words": _words(["Hey"])}],
             owner_user_id="owner-B")
    s = SessionFactory()
    a_parts = s.query(MeetingParticipant).filter_by(meeting_id=a).all()
    b_parts = s.query(MeetingParticipant).filter_by(meeting_id=b).all()
    assert {p.id for p in a_parts}.isdisjoint({p.id for p in b_parts})
    # Every participant's owner is reachable only through its own meeting.
    assert all(s.get(Meeting, p.meeting_id).owner_user_id == "owner-A" for p in a_parts)
    assert all(s.get(Meeting, p.meeting_id).owner_user_id == "owner-B" for p in b_parts)
    s.close()
