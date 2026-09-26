"""Phase 6C tests: conservative identity resolution, People API, manual link/unlink/merge,
deterministic backfill, and owner isolation. Resolution never merges on name alone."""
import pytest

import app.services.people as people
import app.services.transcription as tx
from app.models import Meeting, MeetingParticipant, Person, PersonIdentity, TranscriptSegment
from app.services.transcription import run_process_transcript


# ── fixtures / helpers ─────────────────────────────────────────────────────────

def _meeting(s, owner="user-1", **kw):
    kw.setdefault("status", "ready")
    kw.setdefault("source", "manual")
    m = Meeting(owner_user_id=owner, **kw)
    s.add(m)
    s.commit()
    return m


def _participant(s, meeting, **kw):
    p = MeetingParticipant(meeting_id=meeting.id, **kw)
    s.add(p)
    s.commit()
    return p


class _FakeRecall:
    def __init__(self, payload):
        self._payload = payload

    def get_transcript(self, tid):
        return {"id": tid, "data": {"download_url": "https://dl.example/x"}}

    def download_transcript(self, url):
        return self._payload


# ── email normalization ───────────────────────────────────────────────────────

def test_normalize_email():
    assert people.normalize_email("  Sarah@Acme.COM ") == "sarah@acme.com"
    assert people.normalize_email("not-an-email") is None
    assert people.normalize_email(None) is None
    assert people.normalize_email("") is None


# ── resolution ladder ──────────────────────────────────────────────────────────

def test_same_email_across_two_meetings_resolves_to_one_person(SessionFactory):
    s = SessionFactory()
    m1, m2 = _meeting(s), _meeting(s)
    p1 = _participant(s, m1, provider="zoom", provider_participant_id="10",
                      display_name="Sarah Chen", email="Sarah@Acme.com")
    p2 = _participant(s, m2, provider="google_meet", provider_participant_id="99",
                      display_name="Sarah", email="sarah@acme.com")
    people.resolve_meeting_participants(s, m1)
    people.resolve_meeting_participants(s, m2)
    s.commit()
    s.refresh(p1); s.refresh(p2)
    assert p1.person_id and p1.person_id == p2.person_id  # one identity across meetings
    assert s.query(Person).count() == 1
    assert s.get(Person, p1.person_id).primary_email == "sarah@acme.com"
    # raw participant data preserved after linking
    assert p2.display_name == "Sarah" and p2.provider_participant_id == "99"
    # linkage stays meeting-scoped
    assert p1.meeting_id == m1.id and p2.meeting_id == m2.id
    s.close()


def test_same_display_name_no_evidence_does_not_merge(SessionFactory):
    s = SessionFactory()
    m1, m2 = _meeting(s), _meeting(s)
    p1 = _participant(s, m1, display_name="Sarah", speaker_label="Sarah")
    p2 = _participant(s, m2, display_name="Sarah", speaker_label="Sarah")
    people.resolve_meeting_participants(s, m1)
    people.resolve_meeting_participants(s, m2)
    s.commit()
    s.refresh(p1); s.refresh(p2)
    assert p1.person_id is None and p2.person_id is None
    assert s.query(Person).count() == 0
    s.close()


def test_same_name_distinct_provider_ids_no_email_does_not_merge(SessionFactory):
    """Provider id alone never auto-creates a Person, and a shared name never merges."""
    s = SessionFactory()
    m1, m2 = _meeting(s), _meeting(s)
    p1 = _participant(s, m1, provider="zoom", provider_participant_id="1", display_name="Sarah")
    p2 = _participant(s, m2, provider="zoom", provider_participant_id="2", display_name="Sarah")
    people.resolve_meeting_participants(s, m1)
    people.resolve_meeting_participants(s, m2)
    s.commit()
    s.refresh(p1); s.refresh(p2)
    assert p1.person_id is None and p2.person_id is None
    assert s.query(Person).count() == 0
    s.close()


def test_anonymous_speaker_remains_unresolved(SessionFactory):
    s = SessionFactory()
    m = _meeting(s)
    p = _participant(s, m, speaker_label="Speaker 1")
    people.resolve_meeting_participants(s, m)
    s.commit()
    s.refresh(p)
    assert p.person_id is None and s.query(Person).count() == 0
    s.close()


def test_provider_id_links_across_meetings_after_manual_bootstrap(SessionFactory):
    """Priority-1 provider-id evidence links to a KNOWN identity once one is established (here via
    a manual association), without ever inventing an identity on its own."""
    s = SessionFactory()
    m1, m2 = _meeting(s), _meeting(s)
    p1 = _participant(s, m1, provider="zoom", provider_participant_id="500", display_name="Ali")
    person = people.create_person(s, "user-1", meeting_participant_id=p1.id)
    s.commit()
    p2 = _participant(s, m2, provider="zoom", provider_participant_id="500", display_name="Ali")
    people.resolve_meeting_participants(s, m2)
    s.commit()
    s.refresh(p2)
    assert p2.person_id == person.id  # matched the known provider-id identity
    s.close()


# ── manual association / unlink / merge ─────────────────────────────────────────

def test_unlink_detaches_and_removes_manual_marker(SessionFactory):
    s = SessionFactory()
    m = _meeting(s)
    p = _participant(s, m, provider="zoom", provider_participant_id="7", display_name="Ali")
    person = people.create_person(s, "user-1", meeting_participant_id=p.id)
    s.commit()
    s.refresh(p)
    assert p.person_id == person.id
    people.unlink_participant(s, "user-1", p.id)
    s.commit()
    s.refresh(p)
    assert p.person_id is None
    assert s.query(PersonIdentity).filter_by(kind="manual", value=p.id).count() == 0
    # raw participant data preserved
    assert p.provider_participant_id == "7" and p.display_name == "Ali"
    s.close()


def test_merge_preserves_all_meeting_associations(SessionFactory):
    s = SessionFactory()
    m1, m2 = _meeting(s), _meeting(s)
    p1 = _participant(s, m1, display_name="A")
    p2 = _participant(s, m2, display_name="A")
    pa = people.create_person(s, "user-1", meeting_participant_id=p1.id)
    pb = people.create_person(s, "user-1", meeting_participant_id=p2.id)
    s.commit()
    target = people.merge_people(s, "user-1", pb.id, pa.id)
    s.commit()
    assert target.id == pa.id
    assert s.get(Person, pb.id) is None  # source removed
    s.refresh(p1); s.refresh(p2)
    assert p1.person_id == pa.id and p2.person_id == pa.id
    assert {mm.id for mm in people.person_meetings(s, "user-1", pa)} == {m1.id, m2.id}
    s.close()


def test_merge_into_self_rejected(SessionFactory):
    s = SessionFactory()
    m = _meeting(s)
    p = _participant(s, m, display_name="A")
    person = people.create_person(s, "user-1", meeting_participant_id=p.id)
    s.commit()
    with pytest.raises(ValueError):
        people.merge_people(s, "user-1", person.id, person.id)
    s.close()


# ── owner isolation (service + API) ──────────────────────────────────────────────

def test_owner_isolation_service_layer(SessionFactory):
    s = SessionFactory()
    m = _meeting(s, owner="owner-B")
    p = _participant(s, m, display_name="X")
    person_b = people.create_person(s, "owner-B", meeting_participant_id=p.id)
    s.commit()
    for fn in (
        lambda: people._owned_person(s, "owner-A", person_b.id),
        lambda: people._owned_participant(s, "owner-A", p.id),
        lambda: people.link_participant_to_person(s, "owner-A", p.id, person_b.id),
        lambda: people.unlink_participant(s, "owner-A", p.id),
    ):
        with pytest.raises(people.NotFound):
            fn()
    s.close()


# ── ingestion end-to-end: auto-create from email + idempotency ────────────────────

def _run(SessionFactory, monkeypatch, payload, **fields):
    fields.setdefault("status", "transcribing")
    fields.setdefault("source", "manual")
    fields.setdefault("recall_transcript_id", "tr_1")
    s = SessionFactory()
    m = Meeting(owner_user_id=fields.pop("owner_user_id", "user-1"), **fields)
    s.add(m); s.commit(); mid = m.id; s.close()
    monkeypatch.setattr(tx, "SessionLocal", SessionFactory)
    monkeypatch.setattr(tx, "get_recall_service", lambda k, r: _FakeRecall(payload))
    monkeypatch.setattr("app.services.intelligence.generate_intelligence", lambda meeting_id: None)
    from app.models import Job
    s = SessionFactory(); s.add(Job(meeting_id=mid, type="process_transcript", status="pending")); s.commit(); s.close()
    run_process_transcript(mid)
    return mid


def test_ingestion_auto_creates_person_from_email_and_is_idempotent(SessionFactory, monkeypatch):
    payload = [{
        "participant": {"id": 100, "name": "Saad", "email": "saad@example.com"},
        "words": [{"text": "Hello", "start_timestamp": {"relative": 0.0}, "end_timestamp": {"relative": 0.4}}],
    }]
    mid = _run(SessionFactory, monkeypatch, payload, provider="zoom")
    run_process_transcript(mid)  # duplicate delivery / retry
    s = SessionFactory()
    assert s.query(Person).count() == 1
    person = s.query(Person).one()
    assert person.primary_email == "saad@example.com"
    part = s.query(MeetingParticipant).filter_by(meeting_id=mid).one()
    assert part.person_id == person.id
    # no duplicate identities from reprocessing
    assert s.query(PersonIdentity).filter_by(kind="email", value="saad@example.com").count() == 1
    s.close()


def test_ingestion_without_email_creates_no_person(SessionFactory, monkeypatch):
    """The common real case (diarization gives id+name, no email) must NOT invent a Person."""
    payload = [{
        "participant": {"id": 100, "name": "Saad"},
        "words": [{"text": "Hi", "start_timestamp": {"relative": 0.0}, "end_timestamp": {"relative": 0.4}}],
    }]
    mid = _run(SessionFactory, monkeypatch, payload)
    s = SessionFactory()
    assert s.query(Person).count() == 0
    assert s.query(MeetingParticipant).filter_by(meeting_id=mid).one().person_id is None
    s.close()


# ── People API ────────────────────────────────────────────────────────────────

def test_people_api_list_and_detail(client, SessionFactory):
    s = SessionFactory()
    m = _meeting(s, owner="user-1", title="Q3 sync")
    p = _participant(s, m, provider="zoom", provider_participant_id="9", display_name="Ali")
    person = people.create_person(s, "user-1", meeting_participant_id=p.id)
    s.commit(); pid = person.id; s.close()

    r = client.get("/api/v1/people")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1 and data[0]["id"] == pid
    assert data[0]["conversation_count"] == 1 and data[0]["display_name"] == "Ali"
    assert data[0]["email"] is None  # not fabricated

    r2 = client.get(f"/api/v1/people/{pid}")
    assert r2.status_code == 200
    body = r2.json()
    assert body["conversation_count"] == 1
    assert [mm["title"] for mm in body["meetings"]] == ["Q3 sync"]


def test_people_api_link_unlink_flow(client, SessionFactory):
    s = SessionFactory()
    m = _meeting(s, owner="user-1", title="Kickoff")
    p = _participant(s, m, display_name="Dana")
    person = people.create_person(s, "user-1", display_name="Dana")  # empty person, no seed
    s.commit(); pid = person.id; part_id = p.id; s.close()

    r = client.post(f"/api/v1/people/{pid}/link-participant", json={"meeting_participant_id": part_id})
    assert r.status_code == 200 and r.json()["conversation_count"] == 1

    r2 = client.post(f"/api/v1/people/{pid}/unlink-participant", json={"meeting_participant_id": part_id})
    assert r2.status_code == 200 and r2.json()["conversation_count"] == 0


def test_people_api_owner_isolation(client, SessionFactory):
    s = SessionFactory()
    m = _meeting(s, owner="someone-else")
    p = _participant(s, m, display_name="X")
    person = people.create_person(s, "someone-else", meeting_participant_id=p.id)
    s.commit(); pid = person.id; part_id = p.id; s.close()

    assert client.get(f"/api/v1/people/{pid}").status_code == 404
    assert client.post(f"/api/v1/people/{pid}/link-participant",
                       json={"meeting_participant_id": part_id}).status_code == 404
    assert client.post(f"/api/v1/people/{pid}/merge",
                       json={"source_person_id": pid}).status_code in (404, 422)
    assert client.get("/api/v1/people").json() == []  # never leaks another owner's people


# ── deterministic historical backfill ────────────────────────────────────────────

def test_backfill_from_segments_is_deterministic_and_creates_no_person(SessionFactory):
    s = SessionFactory()
    m = _meeting(s)
    rows = [("Alice", "Hi"), ("Speaker 1", "Yo"), ("Alice", "Again"), (None, "noise")]
    for i, (lbl, txt) in enumerate(rows):
        s.add(TranscriptSegment(meeting_id=m.id, speaker_label=lbl, text=txt,
                                start_ms=i * 1000, end_ms=i * 1000 + 500, sequence=i, source="x"))
    s.commit()

    n = people.backfill_participants_from_segments(s, m)
    s.commit()
    assert n == 2  # Alice + "Speaker 1"; the null-label row yields no participant
    assert s.query(Person).count() == 0  # never manufacture a Person from a label
    parts = {p.speaker_label: p for p in s.query(MeetingParticipant).filter_by(meeting_id=m.id)}
    assert set(parts) == {"Alice", "Speaker 1"}
    assert all(p.display_name is None and p.person_id is None for p in parts.values())
    for seg in s.query(TranscriptSegment).filter_by(meeting_id=m.id):
        if seg.speaker_label in parts:
            assert seg.meeting_participant_id == parts[seg.speaker_label].id
        else:
            assert seg.meeting_participant_id is None
    # idempotent
    assert people.backfill_participants_from_segments(s, m) == 0
    s.close()
