"""Phase 8b: cross-meeting Ask NoteFlow — grounded answer + citations (Groq mocked)."""
import app.services.intelligence as intel
from app.models import Meeting, TranscriptSegment


def _seed_meeting(SessionFactory, owner="user-1", title="M", n_segments=2):
    s = SessionFactory()
    m = Meeting(owner_user_id=owner, status="ready", source="manual", title=title)
    s.add(m)
    s.flush()
    for i in range(n_segments):
        s.add(TranscriptSegment(meeting_id=m.id, speaker_label="Saad", text=f"{title} line {i}",
                                start_ms=i * 1000, end_ms=i * 1000 + 900, sequence=i,
                                source="assembly_ai_async"))
    s.commit()
    mid = m.id
    s.close()
    return mid


def test_ask_all_spans_meetings_and_validates_citations(client, SessionFactory, monkeypatch):
    a = _seed_meeting(SessionFactory, title="Alpha")
    b = _seed_meeting(SessionFactory, title="Beta")
    monkeypatch.setattr(intel, "SessionLocal", SessionFactory)

    def fake_groq(text, question, today):
        assert "Meeting: Alpha" in text and "Meeting: Beta" in text  # both meetings supplied
        assert today  # today's date threaded through for time-relative questions
        return {"answer": "You committed to two things.", "citations": ["S1", "S999"]}

    monkeypatch.setattr(intel, "_call_ask_all_groq", fake_groq)

    r = client.post("/api/v1/ask", json={"question": "What did I commit to?"})
    assert r.status_code == 200
    body = r.json()
    assert body["answer"] == "You committed to two things."
    assert len(body["citations"]) == 1  # S999 invented → dropped
    c = body["citations"][0]
    assert c["meeting_id"] in {a, b} and c["meeting_title"] in {"Alpha", "Beta"}
    assert "segment_id" in c and isinstance(c["start"], (int, float))


def test_ask_all_only_own_meetings(client, SessionFactory, monkeypatch):
    _seed_meeting(SessionFactory, owner="someone-else", title="Secret")
    monkeypatch.setattr(intel, "SessionLocal", SessionFactory)

    def fake_groq(text, question, today):
        assert "Secret" not in text  # another user's transcript must never be supplied
        return {"answer": intel._NOT_FOUND_ALL, "citations": []}

    monkeypatch.setattr(intel, "_call_ask_all_groq", fake_groq)
    r = client.post("/api/v1/ask", json={"question": "anything?"})
    # current user (user-1) has no meetings → honest empty answer, Groq not even needed
    assert r.status_code == 200
    assert r.json()["citations"] == []


def test_ask_all_rejects_empty_question(client, SessionFactory):
    r = client.post("/api/v1/ask", json={"question": "   "})
    assert r.status_code == 422


def test_ask_all_honest_when_unsupported(client, SessionFactory, monkeypatch):
    _seed_meeting(SessionFactory, title="Alpha")
    monkeypatch.setattr(intel, "SessionLocal", SessionFactory)
    monkeypatch.setattr(intel, "_call_ask_all_groq",
                        lambda t, q, today: {"answer": intel._NOT_FOUND_ALL, "citations": ["S1"]})
    r = client.post("/api/v1/ask", json={"question": "Who won the game?"})
    assert r.json()["answer"] == intel._NOT_FOUND_ALL
    assert r.json()["citations"] == []
