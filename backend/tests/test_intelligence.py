"""Phase 5: Groq intelligence generation — citation validation + idempotency (Groq mocked)."""
import app.services.intelligence as intel
from app.models import Meeting, MeetingIntelligence, TranscriptSegment


def _seed(SessionFactory):
    s = SessionFactory()
    m = Meeting(owner_user_id="user-1", status="ready", source="manual", title="T")
    s.add(m)
    s.flush()
    for i in range(3):
        s.add(TranscriptSegment(meeting_id=m.id, speaker_label="Saad", text=f"line {i}",
                                start_ms=i * 1000, end_ms=i * 1000 + 500, sequence=i,
                                source="assembly_ai_async"))
    s.commit()
    mid = m.id
    s.close()
    return mid


# Groq returns valid refs (S1) plus an invented one (S99) that must be dropped.
_GROQ_RAW = {
    "summary": "We aligned on the plan.",
    "key_points": ["point a", ""],
    "decisions": [{"text": "Ship it", "segment_refs": ["S1", "S99"]}],
    "action_items": [{"text": "Saad finishes the workspace", "owner": "Saad", "segment_refs": ["S2"]}],
    "important_moments": [{"title": "Decision", "segment_ref": "S3"}],
}


def test_generate_validates_citations_and_is_idempotent(SessionFactory, monkeypatch):
    mid = _seed(SessionFactory)
    monkeypatch.setattr(intel, "SessionLocal", SessionFactory)
    calls = {"n": 0}

    def fake_groq(text):
        calls["n"] += 1
        assert "[S1]" in text and "Saad" in text  # real transcript, labelled refs
        return _GROQ_RAW

    monkeypatch.setattr(intel, "_call_groq", fake_groq)

    assert intel.generate_intelligence(mid) is True

    s = SessionFactory()
    seg_ids = {r[0] for r in s.execute(__import__("sqlalchemy").text(
        "select id from transcript_segments where meeting_id=:m order by sequence"), {"m": mid})}
    row = s.get(MeetingIntelligence, mid)
    c = row.content
    s.close()

    assert c["summary"] == "We aligned on the plan."
    assert c["key_points"] == ["point a"]  # empty dropped
    # invalid ref S99 dropped, S1 mapped to a real id
    assert len(c["decisions"][0]["segment_ids"]) == 1
    assert c["decisions"][0]["segment_ids"][0] in seg_ids
    assert c["action_items"][0]["owner"] == "Saad"
    assert c["important_moments"][0]["segment_ids"][0] in seg_ids

    # Idempotent: second call does not re-hit Groq or duplicate.
    assert intel.generate_intelligence(mid) is True
    assert calls["n"] == 1


def test_generate_skips_without_segments(SessionFactory, monkeypatch):
    s = SessionFactory()
    m = Meeting(owner_user_id="user-1", status="ready", source="manual")
    s.add(m); s.commit(); mid = m.id; s.close()
    monkeypatch.setattr(intel, "SessionLocal", SessionFactory)
    monkeypatch.setattr(intel, "_call_groq", lambda t: (_ for _ in ()).throw(AssertionError("should not call")))
    assert intel.generate_intelligence(mid) is False


def test_intelligence_endpoint_states(client, SessionFactory):
    # no transcript -> unavailable
    s = SessionFactory()
    m = Meeting(owner_user_id="user-1", status="ready", source="manual")
    s.add(m); s.commit(); mid = m.id; s.close()
    r = client.get(f"/api/v1/meetings/{mid}/intelligence")
    assert r.status_code == 200 and r.json()["state"] == "unavailable"

    # transcript but no intelligence yet -> generating
    s = SessionFactory()
    s.add(TranscriptSegment(meeting_id=mid, speaker_label="A", text="hi", start_ms=0, end_ms=1,
                            sequence=0, source="assembly_ai_async"))
    s.commit(); s.close()
    r = client.get(f"/api/v1/meetings/{mid}/intelligence")
    assert r.json()["state"] == "generating"

    # intelligence present -> ready
    s = SessionFactory()
    s.add(MeetingIntelligence(meeting_id=mid, model="openai/gpt-oss-120b",
                              content={"summary": "s", "key_points": [], "decisions": [],
                                       "action_items": [], "important_moments": []}))
    s.commit(); s.close()
    r = client.get(f"/api/v1/meetings/{mid}/intelligence")
    assert r.json()["state"] == "ready" and r.json()["content"]["summary"] == "s"
