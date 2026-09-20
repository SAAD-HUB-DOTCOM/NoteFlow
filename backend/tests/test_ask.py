"""Phase 8: Ask NoteFlow — grounded answer + citation validation (Groq mocked)."""
import app.services.intelligence as intel
from app.models import Meeting, TranscriptSegment


def _seed(SessionFactory, owner="user-1", with_segments=True):
    s = SessionFactory()
    m = Meeting(owner_user_id=owner, status="ready", source="manual", title="T")
    s.add(m)
    s.flush()
    if with_segments:
        for i in range(3):
            s.add(TranscriptSegment(meeting_id=m.id, speaker_label="Saad", text=f"line {i}",
                                    start_ms=i * 1000, end_ms=i * 1000 + 900, sequence=i,
                                    source="assembly_ai_async"))
    s.commit()
    mid = m.id
    s.close()
    return mid


def test_ask_returns_answer_and_validates_citations(client, SessionFactory, monkeypatch):
    mid = _seed(SessionFactory)
    monkeypatch.setattr(intel, "SessionLocal", SessionFactory)

    def fake_groq(text, question):
        assert "[S1 0:00-0:00]" in text  # ranged, labelled refs from the real transcript
        assert question == "What did we decide?"
        return {"answer": "We decided to ship.", "citations": ["S2", "S99"]}  # S99 invented

    monkeypatch.setattr(intel, "_call_ask_groq", fake_groq)

    seg_ids = _segment_ids(SessionFactory, mid)
    r = client.post(f"/api/v1/meetings/{mid}/ask", json={"question": "What did we decide?"})
    assert r.status_code == 200
    body = r.json()
    assert body["answer"] == "We decided to ship."
    assert body["citations"] == [seg_ids[1]]  # S2 mapped to real id, S99 dropped


def test_ask_honest_when_unsupported(client, SessionFactory, monkeypatch):
    mid = _seed(SessionFactory)
    monkeypatch.setattr(intel, "SessionLocal", SessionFactory)
    monkeypatch.setattr(intel, "_call_ask_groq",
                        lambda t, q: {"answer": intel._NOT_FOUND, "citations": ["S1"]})
    r = client.post(f"/api/v1/meetings/{mid}/ask", json={"question": "Who won the World Cup?"})
    body = r.json()
    assert body["answer"] == intel._NOT_FOUND
    assert body["citations"] == []  # citations dropped when nothing was found


def test_ask_rejects_empty_question(client, SessionFactory):
    mid = _seed(SessionFactory)
    r = client.post(f"/api/v1/meetings/{mid}/ask", json={"question": "   "})
    assert r.status_code == 422


def test_ask_owner_scoped(client, SessionFactory):
    mid = _seed(SessionFactory, owner="someone-else")
    r = client.post(f"/api/v1/meetings/{mid}/ask", json={"question": "hi"})
    assert r.status_code == 404


def test_ask_without_transcript(client, SessionFactory, monkeypatch):
    mid = _seed(SessionFactory, with_segments=False)
    monkeypatch.setattr(intel, "SessionLocal", SessionFactory)
    monkeypatch.setattr(intel, "_call_ask_groq",
                        lambda t, q: (_ for _ in ()).throw(AssertionError("should not call Groq")))
    r = client.post(f"/api/v1/meetings/{mid}/ask", json={"question": "anything?"})
    assert r.status_code == 200
    assert r.json()["citations"] == []
    assert "no transcript" in r.json()["answer"].lower()


def _segment_ids(SessionFactory, mid):
    import sqlalchemy
    s = SessionFactory()
    ids = [r[0] for r in s.execute(sqlalchemy.text(
        "select id from transcript_segments where meeting_id=:m order by sequence"), {"m": mid})]
    s.close()
    return ids
