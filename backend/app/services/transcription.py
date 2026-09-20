"""Phase 4 transcription orchestration: normalize Recall/AssemblyAI transcripts and run the
idempotent background jobs that create + download + persist them.

The download-artifact JSON shape must be reconciled with the real Recall payload when we run the
live transcript test; `normalize_transcript` is written defensively for the documented shapes and
is unit-tested with a representative fixture.
"""
from __future__ import annotations

import logging

from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.db import SessionLocal
from app.models import Job, Meeting, TranscriptSegment
from app.services.recall import get_recall_service

DEFAULT_SOURCE = "assembly_ai_async"
log = logging.getLogger("noteflow.transcription")


# ── Normalization (pure) ────────────────────────────────────────────────────────

def _word_time_seconds(obj: dict, key: str) -> float | None:
    """Best-effort extract a start/end time in seconds from varied word/segment shapes."""
    ts = obj.get(f"{key}_timestamp")
    if isinstance(ts, dict):
        v = ts.get("relative", ts.get("absolute"))
        if v is not None:
            try:
                return float(v)
            except (TypeError, ValueError):
                pass
    for k in (key, f"{key}_time", f"{key}_seconds"):
        if obj.get(k) is not None:
            try:
                return float(obj[k])
            except (TypeError, ValueError):
                pass
    if obj.get(f"{key}_ms") is not None:
        try:
            return float(obj[f"{key}_ms"]) / 1000.0
        except (TypeError, ValueError):
            pass
    return None


# Split a speaker's word stream into readable, timestamped lines.
_MAX_WORDS = 45
_MAX_SPAN_S = 18.0
_MIN_SENTENCE_WORDS = 6


def _entry_speaker(entry: dict) -> str | None:
    """Real Recall shape carries `participant.name`; older/simpler shapes use `speaker`."""
    part = entry.get("participant")
    if isinstance(part, dict):
        name = part.get("name")
        if name:
            return str(name)
        if part.get("id") is not None:
            return f"Speaker {part['id']}"
    speaker = entry.get("speaker", entry.get("speaker_label"))
    if isinstance(speaker, int):
        return f"Speaker {speaker}"
    return str(speaker) if speaker not in (None, "") else None


def _chunk_words(words: list) -> list[tuple[str, float, float]]:
    """Group a participant's words into natural lines (sentence-ish, capped by words/duration)."""
    chunks: list[tuple[str, float, float]] = []
    cur: list[tuple[str, float, float]] = []
    for w in words:
        if not isinstance(w, dict):
            continue
        txt = (w.get("text") or "").strip()
        if not txt:
            continue
        start = _word_time_seconds(w, "start")
        end = _word_time_seconds(w, "end")
        start = start if start is not None else (cur[-1][2] if cur else 0.0)
        end = end if end is not None else start
        cur.append((txt, start, end))
        span = cur[-1][2] - cur[0][1]
        ends_sentence = txt[-1] in ".?!"
        if (ends_sentence and len(cur) >= _MIN_SENTENCE_WORDS) or len(cur) >= _MAX_WORDS or span >= _MAX_SPAN_S:
            chunks.append((" ".join(t for t, _, _ in cur).strip(), cur[0][1], cur[-1][2]))
            cur = []
    if cur:
        chunks.append((" ".join(t for t, _, _ in cur).strip(), cur[0][1], cur[-1][2]))
    return chunks


def normalize_transcript(payload, source: str = DEFAULT_SOURCE) -> list[dict]:
    """Turn a Recall transcript artifact into ordered, readable segment dicts.

    Real Recall async shape: a list of {participant:{name,...}, words:[{text,start_timestamp,
    end_timestamp}]} — one entry per speaker turn. We split each turn into short timestamped lines
    (better reading + seek granularity). Also handles {speaker,text,start,end} entries. [] if empty.
    """
    entries = payload
    if isinstance(payload, dict):
        entries = []
        for key in ("transcript", "segments", "utterances", "monologues", "results"):
            if isinstance(payload.get(key), list):
                entries = payload[key]
                break
    if not isinstance(entries, list):
        return []

    segments: list[dict] = []
    seq = 0
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        speaker_label = _entry_speaker(entry)
        words = entry.get("words")

        if isinstance(words, list) and words:
            lines = _chunk_words(words)
        else:
            text = (entry.get("text") or "").strip()
            if not text:
                continue
            start_s = _word_time_seconds(entry, "start") or 0.0
            end_s = _word_time_seconds(entry, "end") or start_s
            lines = [(text, start_s, end_s)]

        for text, start_s, end_s in lines:
            if not text:
                continue
            segments.append(
                {
                    "speaker_label": speaker_label,
                    "text": text,
                    "start_ms": int(round(start_s * 1000)),
                    "end_ms": int(round(end_s * 1000)),
                    "sequence": seq,
                    "source": source,
                }
            )
            seq += 1
    return segments


def extract_download_url(transcript_obj) -> str | None:
    if not isinstance(transcript_obj, dict):
        return None
    data = transcript_obj.get("data") if isinstance(transcript_obj.get("data"), dict) else {}
    return (data or {}).get("download_url") or transcript_obj.get("download_url")


# ── Job idempotency ─────────────────────────────────────────────────────────────

def enqueue_job(db, meeting_id: str, job_type: str, *, force: bool = False) -> bool:
    """Create a job row; returns True only if newly created (caller then schedules the work).

    Unique (meeting_id, type) guarantees duplicate webhook deliveries can't start duplicate work.
    With force=True (manual reprocess), an existing job is reset to pending and True is returned.
    """
    db.add(Job(meeting_id=meeting_id, type=job_type, status="pending"))
    try:
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        if force:
            job = _job(db, meeting_id, job_type)
            if job:
                job.status = "pending"
                job.error = None
                db.commit()
                return True
        return False


def _job(db, meeting_id: str, job_type: str) -> Job | None:
    return (
        db.query(Job)
        .filter(Job.meeting_id == meeting_id, Job.type == job_type)
        .first()
    )


# ── Background runners (own their DB session) ────────────────────────────────────

def _parse_iso(value):
    from datetime import datetime
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def reconcile_recording(db, meeting, recall) -> bool:
    """Fill recall_recording_id (+ real started/ended/duration) from the bot object when the
    webhook payload didn't carry them. Returns True if the meeting has a recording id after."""
    if meeting.recall_recording_id:
        return True
    if not meeting.recall_bot_id:
        return False
    bot = recall.get_bot(meeting.recall_bot_id)
    recordings = bot.get("recordings") or []
    if not recordings:
        log.warning("reconcile meeting_id=%s: bot has no recordings yet", meeting.id)
        return False
    rec = recordings[-1]
    meeting.recall_recording_id = rec.get("id")
    started = _parse_iso(rec.get("started_at"))
    ended = _parse_iso(rec.get("completed_at"))
    if started and not meeting.started_at:
        meeting.started_at = started
    if ended and not meeting.ended_at:
        meeting.ended_at = ended
    if meeting.duration_seconds is None and started and ended:
        meeting.duration_seconds = int((ended - started).total_seconds())
    db.commit()
    log.info("reconcile meeting_id=%s -> recording_id=%s", meeting.id, meeting.recall_recording_id)
    return bool(meeting.recall_recording_id)


def run_create_transcript(meeting_id: str) -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        meeting = db.get(Meeting, meeting_id)
        if not meeting:
            return
        job = _job(db, meeting_id, "create_transcript")
        if job:
            job.status = "running"
            job.attempts = (job.attempts or 0) + 1
            db.commit()
        try:
            recall = get_recall_service(settings.recall_api_key, settings.recall_region)
            # Real payloads may not carry the recording id — reconcile from the bot object.
            if not reconcile_recording(db, meeting, recall):
                raise RuntimeError("No recording found for this bot yet")
            log.info("create_transcript meeting_id=%s recording_id=%s -> calling Recall",
                     meeting_id, meeting.recall_recording_id)
            result = recall.create_transcript(meeting.recall_recording_id)
            log.info("create_transcript meeting_id=%s accepted by Recall transcript_id=%s",
                     meeting_id, (result or {}).get("id"))
            if job:
                job.status = "succeeded"
                job.error = None
            db.commit()
        except Exception as exc:  # noqa: BLE001 — persist truthful failure, never fake success
            db.rollback()
            log.exception("create_transcript FAILED meeting_id=%s: %s", meeting_id, exc)
            _record_failure(db, meeting_id, job_type="create_transcript",
                            code="create_transcript_failed", message=str(exc))
    finally:
        db.close()


def run_process_transcript(meeting_id: str) -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        meeting = db.get(Meeting, meeting_id)
        if not meeting:
            return
        # Idempotent: segments already persisted → nothing to do.
        if db.query(TranscriptSegment).filter(TranscriptSegment.meeting_id == meeting_id).count():
            return
        job = _job(db, meeting_id, "process_transcript")
        if job:
            job.status = "running"
            job.attempts = (job.attempts or 0) + 1
            db.commit()
        try:
            recall = get_recall_service(settings.recall_api_key, settings.recall_region)
            download_url = None
            if meeting.recall_transcript_id:
                transcript_obj = recall.get_transcript(meeting.recall_transcript_id)
                download_url = extract_download_url(transcript_obj)
            else:
                # Reconcile: the recording's media_shortcuts.transcript carries id + download_url.
                bot = recall.get_bot(meeting.recall_bot_id) if meeting.recall_bot_id else {}
                recordings = bot.get("recordings") or []
                shortcut = ((recordings[-1] if recordings else {}).get("media_shortcuts") or {}).get("transcript") or {}
                if shortcut.get("id"):
                    meeting.recall_transcript_id = shortcut["id"]
                    db.commit()
                download_url = extract_download_url(shortcut) or (
                    (shortcut.get("data") or {}).get("download_url") if isinstance(shortcut.get("data"), dict) else None
                )
            if not download_url:
                raise RuntimeError("Recall transcript has no download_url yet")
            payload = recall.download_transcript(download_url)
            segments = normalize_transcript(payload)
            if not segments:
                # Artifact downloaded fine but has no speech — truthful empty transcript, not failure.
                meeting.status = "ready"
                if job:
                    job.status = "succeeded"
                    job.error = None
                db.commit()
                log.info("process_transcript meeting_id=%s: transcript empty (no speech) -> ready", meeting_id)
                return

            for seg in segments:
                db.add(TranscriptSegment(meeting_id=meeting_id, **seg))
            meeting.status = "ready"
            if job:
                job.status = "succeeded"
                job.error = None
            db.commit()  # atomic: segments + status + job together
            log.info("process_transcript meeting_id=%s persisted %d segments -> ready",
                     meeting_id, len(segments))
            # Phase 5: generate meeting intelligence from the real transcript (best-effort;
            # transcript stays 'ready' even if Groq is down).
            try:
                from app.services.intelligence import generate_intelligence
                generate_intelligence(meeting_id)
            except Exception as exc:  # noqa: BLE001
                log.exception("intelligence generation errored meeting_id=%s: %s", meeting_id, exc)
        except IntegrityError:
            db.rollback()  # concurrent run already inserted segments — treat as done
            log.info("process_transcript meeting_id=%s: segments already present (concurrent)", meeting_id)
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            log.exception("process_transcript FAILED meeting_id=%s: %s", meeting_id, exc)
            _record_failure(db, meeting_id, job_type="process_transcript",
                            code="transcript_processing_failed", message=str(exc))
    finally:
        db.close()


def _record_failure(db, meeting_id: str, *, job_type: str, code: str, message: str) -> None:
    meeting = db.get(Meeting, meeting_id)
    if meeting:
        meeting.status = "failed"
        meeting.processing_error_code = code
        meeting.processing_error_message = message[:2000]
    job = _job(db, meeting_id, job_type)
    if job:
        job.status = "failed"
        job.error = message[:2000]
    db.commit()
