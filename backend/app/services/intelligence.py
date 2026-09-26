
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

import httpx

from app.config import get_settings
from app.db import SessionLocal
from app.models import Meeting, MeetingIntelligence, TranscriptSegment

log = logging.getLogger("noteflow.intelligence")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

_SYSTEM = (
    "You are a meeting-notes assistant. You are given a diarized transcript where each line is "
    "prefixed with a reference like [S3]. Return ONLY JSON with this exact shape:\n"
    '{"summary": str, "key_points": [str], '
    '"decisions": [{"text": str, "segment_refs": [str]}], '
    '"action_items": [{"text": str, "owner": str|null, "segment_refs": [str]}], '
    '"important_moments": [{"title": str, "segment_ref": str}]}\n'
    "Rules: base everything ONLY on the transcript. For every decision, action item, and moment, "
    "cite the [S#] refs it comes from — use ONLY refs that appear in the transcript, never invent "
    "them. Set owner only if a person is clearly responsible; otherwise null. Be concise."
)


class GroqNotConfigured(RuntimeError):
    pass


def _mmss(ms: int) -> str:
    s = max(0, ms // 1000)
    return f"{s // 60}:{s % 60:02d}"


def _serialize(segments: list[TranscriptSegment]) -> tuple[str, dict[str, str]]:
    """Return (prompt_text, ref->real_id map)."""
    lines: list[str] = []
    ref_map: dict[str, str] = {}
    for i, seg in enumerate(segments, start=1):
        ref = f"S{i}"
        ref_map[ref] = seg.id
        speaker = seg.speaker_label or "Speaker"
        lines.append(f"[{ref}] ({_mmss(seg.start_ms)}) {speaker}: {seg.text}")
    return "\n".join(lines), ref_map


def _call_groq(transcript_text: str) -> dict:
    settings = get_settings()
    if not settings.groq_api_key:
        raise GroqNotConfigured("GROQ_API_KEY is not configured.")
    resp = httpx.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
        json={
            "model": settings.groq_model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": f"Transcript:\n{transcript_text}"},
            ],
        },
        timeout=90,
    )
    resp.raise_for_status()
    return json.loads(resp.json()["choices"][0]["message"]["content"])


def _valid_refs(refs, ref_map: dict[str, str]) -> list[str]:
    """Map [S#] refs to real segment ids, dropping anything the model invented."""
    out: list[str] = []
    if isinstance(refs, list):
        for r in refs:
            real = ref_map.get(str(r))
            if real and real not in out:
                out.append(real)
    return out


def _validate(raw: dict, ref_map: dict[str, str]) -> dict:
    def _clean_list(items, ref_key, is_single=False):
        cleaned = []
        for it in items or []:
            if not isinstance(it, dict):
                continue
            entry = {k: v for k, v in it.items() if k in ("text", "title", "owner")}
            if is_single:
                real = ref_map.get(str(it.get(ref_key)))
                entry["segment_ids"] = [real] if real else []
            else:
                entry["segment_ids"] = _valid_refs(it.get(ref_key), ref_map)
            if entry.get("text") or entry.get("title"):
                cleaned.append(entry)
        return cleaned

    return {
        "summary": str(raw.get("summary") or "").strip(),
        "key_points": [str(p).strip() for p in (raw.get("key_points") or []) if str(p).strip()],
        "decisions": _clean_list(raw.get("decisions"), "segment_refs"),
        "action_items": _clean_list(raw.get("action_items"), "segment_refs"),
        "important_moments": _clean_list(raw.get("important_moments"), "segment_ref", is_single=True),
    }


_ASK_SYSTEM = (
    "You answer a question about ONE meeting using ONLY its transcript. Each line is prefixed with "
    'a ref like [S3 00:14-00:21]. Return ONLY JSON: {"answer": str, "citations": [str]}. Cite the '
    'refs that support your answer as their S# token only (e.g. "S3"); use ONLY refs that appear in '
    "the transcript, never invent them. If the transcript does not contain the answer, set answer "
    "to exactly \"I couldn't find that in this meeting.\" and citations to []. Do not use any "
    "outside knowledge. Be concise and specific."
)

_NOT_FOUND = "I couldn't find that in this meeting."


def _call_ask_groq(transcript_text: str, question: str) -> dict:
    settings = get_settings()
    if not settings.groq_api_key:
        raise GroqNotConfigured("GROQ_API_KEY is not configured.")
    resp = httpx.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
        json={
            "model": settings.groq_model,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": _ASK_SYSTEM},
                {"role": "user", "content": f"Transcript:\n{transcript_text}\n\nQuestion: {question}"},
            ],
        },
        timeout=90,
    )
    resp.raise_for_status()
    return json.loads(resp.json()["choices"][0]["message"]["content"])


def answer_question(meeting_id: str, question: str) -> dict | None:
    """Answer a question grounded in a meeting's real transcript.

    Returns {"answer": str, "citations": [real_segment_id, ...]} — citations validated against the
    meeting's actual segments (invented refs dropped). Returns None if the meeting has no transcript
    to answer from. Never fabricates: unsupported questions get an honest "couldn't find it".
    """
    db = SessionLocal()
    try:
        segments = (
            db.query(TranscriptSegment)
            .filter(TranscriptSegment.meeting_id == meeting_id)
            .order_by(TranscriptSegment.sequence)
            .all()
        )
        if not segments:
            return None
        lines: list[str] = []
        ref_map: dict[str, str] = {}
        for i, seg in enumerate(segments, start=1):
            ref = f"S{i}"
            ref_map[ref] = seg.id
            speaker = seg.speaker_label or "Speaker"
            lines.append(f"[{ref} {_mmss(seg.start_ms)}-{_mmss(seg.end_ms)}] {speaker}: {seg.text}")
        raw = _call_ask_groq("\n".join(lines), question)
        answer = str(raw.get("answer") or "").strip() or _NOT_FOUND
        citations = _valid_refs(raw.get("citations"), ref_map)
        if answer == _NOT_FOUND:
            citations = []
        return {"answer": answer, "citations": citations}
    finally:
        db.close()



_ASK_ALL_SYSTEM = (
    "You answer questions across a user's OWN recorded meetings using ONLY the provided transcripts. "
    "Lines are grouped under a meeting header and prefixed with a ref like [S3 00:14]. Return ONLY "
    'JSON: {"answer": str, "citations": [str]}. Cite the refs that support your answer as their S# '
    'token only (e.g. "S3"); use ONLY refs that appear below, never invent them. When the question '
    "is time-relative (today, this week), use the given today's date and each meeting's date. If the "
    "transcripts do not contain the answer, set answer to exactly \"I couldn't find that across your "
    "meetings.\" and citations to []. Do not use outside knowledge. Be concise; refer to meetings by "
    "name."
)

_NOT_FOUND_ALL = "I couldn't find that across your meetings."
_ASK_ALL_CHAR_BUDGET = 80_000


def _call_ask_all_groq(transcript_text: str, question: str, today: str) -> dict:
    settings = get_settings()
    if not settings.groq_api_key:
        raise GroqNotConfigured("GROQ_API_KEY is not configured.")
    resp = httpx.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
        json={
            "model": settings.groq_model,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": _ASK_ALL_SYSTEM},
                {
                    "role": "user",
                    "content": f"Today's date: {today}\n\nMeetings:\n{transcript_text}\n\nQuestion: {question}",
                },
            ],
        },
        timeout=90,
    )
    resp.raise_for_status()
    return json.loads(resp.json()["choices"][0]["message"]["content"])


def answer_across_meetings(owner_user_id: str, question: str) -> dict:
    """Answer a question grounded in ALL of the user's transcribed meetings.

    Returns {"answer": str, "citations": [{segment_id, meeting_id, meeting_title, start}]}. Citations
    are validated to real segments (invented refs dropped). Never fabricates: unsupported questions
    get an honest "couldn't find it". Prompt size is capped (no embeddings in this MVP), so the
    newest meetings are prioritized and older ones may be omitted when the history is very large.
    """
    db = SessionLocal()
    try:
        meetings = (
            db.query(Meeting)
            .filter(Meeting.owner_user_id == owner_user_id)
            .order_by(Meeting.created_at.desc())
            .all()
        )
        blocks: list[str] = []
        ref_map: dict[str, dict] = {}
        counter = 0
        chars = 0
        truncated = False
        for m in meetings:
            segs = (
                db.query(TranscriptSegment)
                .filter(TranscriptSegment.meeting_id == m.id)
                .order_by(TranscriptSegment.sequence)
                .all()
            )
            if not segs:
                continue
            title = m.title or "Untitled meeting"
            when = (m.started_at or m.created_at)
            header = f"=== Meeting: {title} ({when.date().isoformat()}) ==="
            local: list[tuple[str, dict]] = []
            lines = [header]
            for seg in segs:
                counter += 1
                ref = f"S{counter}"
                lines.append(f"[{ref} {_mmss(seg.start_ms)}] {seg.speaker_label or 'Speaker'}: {seg.text}")
                local.append((ref, {
                    "segment_id": seg.id,
                    "meeting_id": m.id,
                    "meeting_title": title,
                    "start": seg.start_ms / 1000.0,
                }))
            block = "\n".join(lines)
            if blocks and chars + len(block) > _ASK_ALL_CHAR_BUDGET:
                counter -= len(local)
                truncated = True
                break
            chars += len(block)
            blocks.append(block)
            for ref, info in local:
                ref_map[ref] = info

        if not blocks:
            return {"answer": "You don't have any transcribed meetings to ask about yet.", "citations": []}
        if truncated:
            log.info("ask-all owner=%s: history truncated to %d chars", owner_user_id, chars)

        today = datetime.now(timezone.utc).date().isoformat()
        raw = _call_ask_all_groq("\n\n".join(blocks), question, today)
        answer = str(raw.get("answer") or "").strip() or _NOT_FOUND_ALL
        citations: list[dict] = []
        if answer != _NOT_FOUND_ALL and isinstance(raw.get("citations"), list):
            seen: set[str] = set()
            for r in raw["citations"]:
                info = ref_map.get(str(r))
                if info and info["segment_id"] not in seen:
                    seen.add(info["segment_id"])
                    citations.append(info)
        return {"answer": answer, "citations": citations}
    finally:
        db.close()


def generate_intelligence(meeting_id: str, *, force: bool = False) -> bool:
    """Generate + persist intelligence for a meeting. Idempotent. Returns True if a row now exists."""
    settings = get_settings()
    db = SessionLocal()
    try:
        if not force and db.get(MeetingIntelligence, meeting_id) is not None:
            return True
        segments = (
            db.query(TranscriptSegment)
            .filter(TranscriptSegment.meeting_id == meeting_id)
            .order_by(TranscriptSegment.sequence)
            .all()
        )
        if not segments:
            log.info("intelligence meeting_id=%s: no segments, skipping", meeting_id)
            return False
        text, ref_map = _serialize(segments)
        try:
            raw = _call_groq(text)
        except Exception as exc:  
            log.exception("intelligence meeting_id=%s Groq FAILED: %s", meeting_id, exc)
            return False
        content = _validate(raw, ref_map)
        existing = db.get(MeetingIntelligence, meeting_id)
        if existing:
            existing.content = content
            existing.model = settings.groq_model
        else:
            db.add(MeetingIntelligence(meeting_id=meeting_id, model=settings.groq_model, content=content))
        db.commit()
        log.info("intelligence meeting_id=%s persisted (%d actions, %d decisions)",
                 meeting_id, len(content["action_items"]), len(content["decisions"]))
        return True
    finally:
        db.close()
