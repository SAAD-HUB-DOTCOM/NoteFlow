"""Sharing + cross-meeting rollups (action items, highlights)."""
from app.models import Meeting, MeetingIntelligence, TranscriptSegment


def _seed_meeting_with_intel(SessionFactory, owner="user-1", title="M"):
    s = SessionFactory()
    m = Meeting(owner_user_id=owner, status="ready", source="manual", title=title)
    s.add(m)
    s.flush()
    seg_ids = []
    for i in range(2):
        seg = TranscriptSegment(meeting_id=m.id, speaker_label="Saad", text=f"line {i}",
                                start_ms=(i + 1) * 5000, end_ms=(i + 1) * 5000 + 900, sequence=i,
                                source="assembly_ai_async")
        s.add(seg)
        s.flush()
        seg_ids.append(seg.id)
    s.add(MeetingIntelligence(meeting_id=m.id, model="openai/gpt-oss-120b", content={
        "summary": "s", "key_points": [],
        "decisions": [],
        "action_items": [{"text": "Saad ships the workspace", "owner": "Saad", "segment_ids": [seg_ids[1]]},
                         {"text": "", "owner": None, "segment_ids": []}],  # empty dropped
        "important_moments": [{"title": "Deployment decided", "segment_ids": [seg_ids[0]]}],
    }))
    s.commit()
    mid = m.id
    s.close()
    return mid, seg_ids


def test_action_items_rollup(client, SessionFactory):
    mid, seg_ids = _seed_meeting_with_intel(SessionFactory, title="Alpha")
    r = client.get("/api/v1/action-items")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1  # the empty one is dropped
    it = items[0]
    assert it["text"] == "Saad ships the workspace"
    assert it["owner"] == "Saad"
    assert it["meeting_id"] == mid and it["meeting_title"] == "Alpha"
    assert it["start"] == 10.0  # seg_ids[1] start_ms=10000


def test_highlights_rollup(client, SessionFactory):
    mid, _ = _seed_meeting_with_intel(SessionFactory, title="Alpha")
    r = client.get("/api/v1/highlights")
    hi = r.json()
    assert len(hi) == 1
    assert hi[0]["title"] == "Deployment decided"
    assert hi[0]["start"] == 5.0


def test_rollups_owner_scoped(client, SessionFactory):
    _seed_meeting_with_intel(SessionFactory, owner="someone-else", title="Secret")
    assert client.get("/api/v1/action-items").json() == []
    assert client.get("/api/v1/highlights").json() == []


def test_share_create_public_read_and_revoke(client, SessionFactory):
    mid, _ = _seed_meeting_with_intel(SessionFactory, title="Alpha")

    # Share → token; idempotent.
    r = client.post(f"/api/v1/meetings/{mid}/share")
    assert r.status_code == 200
    token = r.json()["share_id"]
    assert token
    assert client.post(f"/api/v1/meetings/{mid}/share").json()["share_id"] == token

    # Public read by token — no owner data, includes transcript + intelligence.
    pub = client.get(f"/api/v1/shared/{token}")
    assert pub.status_code == 200
    body = pub.json()
    assert body["title"] == "Alpha"
    assert len(body["segments"]) == 2
    assert body["intelligence"]["summary"] == "s"
    assert "owner_user_id" not in body and "meeting_url" not in body

    # Revoke → old link 404s.
    assert client.delete(f"/api/v1/meetings/{mid}/share").json()["share_id"] is None
    assert client.get(f"/api/v1/shared/{token}").status_code == 404


def test_share_owner_scoped(client, SessionFactory):
    mid, _ = _seed_meeting_with_intel(SessionFactory, owner="someone-else")
    assert client.post(f"/api/v1/meetings/{mid}/share").status_code == 404


def test_shared_unknown_token_404(client, SessionFactory):
    assert client.get("/api/v1/shared/nope-not-real").status_code == 404
