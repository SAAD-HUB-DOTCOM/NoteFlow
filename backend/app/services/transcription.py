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


def normalize_transcript(payload, source: str = DEFAULT_SOURCE) -> list[dict]:
    """Turn a Recall transcript artifact into ordered segment dicts.

    Handles the common Recall shape (list of {speaker, words:[{text,start_timestamp,end_timestamp}]})
    and simpler {speaker, text, start, end} entries. Returns [] if nothing parseable.
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
        speaker = entry.get("speaker", entry.get("speaker_label"))
        if isinstance(speaker, int):
            speaker = f"Speaker {speaker}"
        speaker_label = str(speaker) if speaker not in (None, "") else None

        words = entry.get("words")
        if isinstance(words, list) and words:
            text = " ".join(
                (w.get("text") or "").strip() for w in words if isinstance(w, dict)
            ).strip()
            starts = [t for t in (_word_time_seconds(w, "start") for w in words if isinstance(w, dict)) if t is not None]
            ends = [t for t in (_word_time_seconds(w, "end") for w in words if isinstance(w, dict)) if t is not None]
            start_s = min(starts) if starts else 0.0
            end_s = max(ends) if ends else start_s
        else:
            text = (entry.get("text") or "").strip()
            start_s = _word_time_seconds(entry, "start") or 0.0
            end_s = _word_time_seconds(entry, "end") or start_s

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

def enqueue_job(db, meeting_id: str, job_type: str) -> bool:
    """Create a job row; returns True only if newly created (caller then schedules the work).

    Unique (meeting_id, type) guarantees duplicate webhook deliveries can't start duplicate work.
    """
    db.add(Job(meeting_id=meeting_id, type=job_type, status="pending"))
    try:
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        return False


def _job(db, meeting_id: str, job_type: str) -> Job | None:
    return (
        db.query(Job)
        .filter(Job.meeting_id == meeting_id, Job.type == job_type)
        .first()
    )


# ── Background runners (own their DB session) ────────────────────────────────────

def run_create_transcript(meeting_id: str) -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        meeting = db.get(Meeting, meeting_id)
        if not meeting or not meeting.recall_recording_id:
            return
        job = _job(db, meeting_id, "create_transcript")
        if job:
            job.status = "running"
            job.attempts = (job.attempts or 0) + 1
            db.commit()
        try:
            recall = get_recall_service(settings.recall_api_key, settings.recall_region)
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
        if not meeting or not meeting.recall_transcript_id:
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
            transcript_obj = recall.get_transcript(meeting.recall_transcript_id)
            download_url = extract_download_url(transcript_obj)
            if not download_url:
                raise RuntimeError("Recall transcript has no download_url yet")
            payload = recall.download_transcript(download_url)
            segments = normalize_transcript(payload)
            if not segments:
                raise RuntimeError("No transcript segments parsed from artifact")

            for seg in segments:
                db.add(TranscriptSegment(meeting_id=meeting_id, **seg))
            meeting.status = "ready"
            if job:
                job.status = "succeeded"
                job.error = None
            db.commit()  # atomic: segments + status + job together
            log.info("process_transcript meeting_id=%s persisted %d segments -> ready",
                     meeting_id, len(segments))
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
