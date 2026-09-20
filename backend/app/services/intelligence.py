"""Phase 5 — real Groq meeting intelligence from the persisted transcript.

Segments are labelled [S1], [S2]… in the prompt (never the raw uuids, which the model would
hallucinate); the model cites those short refs, and we map them back to real segment ids and drop
any it invents. Idempotent: one row per meeting (PK), skipped if present unless force=True.
"""
from __future__ import annotations

import json
import logging

import httpx

from app.config import get_settings
from app.db import SessionLocal
from app.models import MeetingIntelligence, TranscriptSegment

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
        except Exception as exc:  # noqa: BLE001 — never fake intelligence
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
