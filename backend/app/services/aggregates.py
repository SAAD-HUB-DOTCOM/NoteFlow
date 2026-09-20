"""Cross-meeting rollups from the already-generated Groq intelligence (no new AI calls).

Action items and highlights are read straight out of MeetingIntelligence.content for the owner's
meetings and resolved to a real transcript timestamp (the first cited segment) so the UI can link
back to the exact moment. No fabrication: only what the transcript-grounded intelligence produced.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Meeting, MeetingIntelligence, TranscriptSegment


def _owner_meetings_with_intel(db: Session, owner_user_id: str):
    """(Meeting, MeetingIntelligence) for the owner, newest first."""
    return (
        db.query(Meeting, MeetingIntelligence)
        .join(MeetingIntelligence, MeetingIntelligence.meeting_id == Meeting.id)
        .filter(Meeting.owner_user_id == owner_user_id)
        .order_by(Meeting.created_at.desc())
        .all()
    )


def _start_lookup(db: Session, segment_ids: set[str]) -> dict[str, float]:
    """Map segment id -> start seconds for the given ids (single query)."""
    if not segment_ids:
        return {}
    rows = (
        db.query(TranscriptSegment.id, TranscriptSegment.start_ms)
        .filter(TranscriptSegment.id.in_(segment_ids))
        .all()
    )
    return {sid: (ms or 0) / 1000.0 for sid, ms in rows}


def _first_ref(item: dict) -> str | None:
    refs = item.get("segment_ids")
    if isinstance(refs, list) and refs:
        return str(refs[0])
    return None


def list_action_items(db: Session, owner_user_id: str) -> list[dict]:
    pairs = _owner_meetings_with_intel(db, owner_user_id)
    wanted: set[str] = set()
    for _, intel in pairs:
        for it in (intel.content or {}).get("action_items") or []:
            ref = _first_ref(it)
            if ref:
                wanted.add(ref)
    starts = _start_lookup(db, wanted)

    out: list[dict] = []
    for meeting, intel in pairs:
        for it in (intel.content or {}).get("action_items") or []:
            text = str(it.get("text") or "").strip()
            if not text:
                continue
            ref = _first_ref(it)
            out.append({
                "text": text,
                "owner": it.get("owner"),
                "meeting_id": meeting.id,
                "meeting_title": meeting.title or "Untitled meeting",
                "meeting_date": meeting.started_at or meeting.created_at,
                "segment_id": ref,
                "start": starts.get(ref) if ref else None,
            })
    return out


def list_highlights(db: Session, owner_user_id: str) -> list[dict]:
    pairs = _owner_meetings_with_intel(db, owner_user_id)
    wanted: set[str] = set()
    for _, intel in pairs:
        for it in (intel.content or {}).get("important_moments") or []:
            ref = _first_ref(it)
            if ref:
                wanted.add(ref)
    starts = _start_lookup(db, wanted)

    out: list[dict] = []
    for meeting, intel in pairs:
        for it in (intel.content or {}).get("important_moments") or []:
            title = str(it.get("title") or "").strip()
            if not title:
                continue
            ref = _first_ref(it)
            out.append({
                "title": title,
                "meeting_id": meeting.id,
                "meeting_title": meeting.title or "Untitled meeting",
                "meeting_date": meeting.started_at or meeting.created_at,
                "segment_id": ref,
                "start": starts.get(ref) if ref else None,
            })
    return out
