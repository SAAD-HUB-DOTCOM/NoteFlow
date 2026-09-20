"""Recall webhook receiver: verify signature, dedupe, normalize → meeting status.

Kept outside the JWT-protected API; secured by Recall signature verification (§9). Long work
is deferred to BackgroundTasks (Phase 4 fills in transcript/intelligence); the handler stays
fast and idempotent.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Request, Response, status
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.db import SessionLocal
from app.models import Meeting, WebhookEvent
from app.services.recall import map_bot_status, verify_webhook_signature, webhook_event_id
from app.services.transcription import (
    enqueue_job,
    run_create_transcript,
    run_process_transcript,
)

router = APIRouter()


def _extract_bot_id(body: dict) -> str | None:
    data = body.get("data") or {}
    bot = data.get("bot") if isinstance(data.get("bot"), dict) else {}
    return data.get("bot_id") or (bot or {}).get("id") or body.get("bot_id")


def _extract_status_code(body: dict) -> str | None:
    data = body.get("data") or {}
    st = data.get("status")
    if isinstance(st, dict):
        return st.get("code")
    return st if isinstance(st, str) else None


def _extract_recording_id(body: dict) -> str | None:
    """The RECORDING id (never the bot id)."""
    data = body.get("data") or {}
    rec = data.get("recording") if isinstance(data.get("recording"), dict) else {}
    return (rec or {}).get("id") or data.get("recording_id")


def _extract_transcript_id(body: dict) -> str | None:
    data = body.get("data") or {}
    tr = data.get("transcript") if isinstance(data.get("transcript"), dict) else {}
    return (tr or {}).get("id") or data.get("transcript_id")


def _parse_dt(value) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _apply_recording_times(meeting: Meeting, body: dict) -> None:
    """Best-effort populate started_at/ended_at/duration from the recording.done payload.

    Only sets fields that are present + parseable and not already set — smallest safe fix, no new
    webhooks or scope. Field names are defensive pending confirmation against the real payload.
    """
    data = body.get("data") or {}
    rec = data.get("recording") if isinstance(data.get("recording"), dict) else {}
    started = _parse_dt(rec.get("started_at") or rec.get("start_time"))
    ended = _parse_dt(rec.get("completed_at") or rec.get("ended_at") or rec.get("end_time"))
    if started and not meeting.started_at:
        meeting.started_at = started
    if ended and not meeting.ended_at:
        meeting.ended_at = ended
    if meeting.duration_seconds is None:
        dur = rec.get("duration") or rec.get("duration_seconds")
        try:
            if dur is not None:
                meeting.duration_seconds = int(float(dur))
        except (TypeError, ValueError):
            pass
        if meeting.duration_seconds is None and meeting.started_at and meeting.ended_at:
            meeting.duration_seconds = int((meeting.ended_at - meeting.started_at).total_seconds())


def apply_event(db, body: dict, background_tasks: BackgroundTasks | None = None) -> None:
    """Map a Recall event onto the owning meeting; drive Phase 4 transcription idempotently."""
    bot_id = _extract_bot_id(body)
    if not bot_id:
        return
    meeting = db.query(Meeting).filter(Meeting.recall_bot_id == bot_id).first()
    if meeting is None:
        return

    event_type = (body.get("event") or "").lower()
    code = _extract_status_code(body)
    mapped = map_bot_status(code) if code else None
    if mapped:
        meeting.status = mapped

    if event_type in ("recording.done", "bot.recording_done", "recording_done"):
        recording_id = _extract_recording_id(body)
        if recording_id and not meeting.recall_recording_id:
            meeting.recall_recording_id = recording_id
        _apply_recording_times(meeting, body)
        meeting.status = "transcribing"
        db.commit()
        # Kick off the async transcript creation once, idempotently.
        if meeting.recall_recording_id and enqueue_job(db, meeting.id, "create_transcript"):
            if background_tasks is not None:
                background_tasks.add_task(run_create_transcript, meeting.id)
        return

    if event_type in ("transcript.processing", "transcript_processing"):
        meeting.status = "transcribing"
        db.commit()
        return

    if event_type in ("transcript.done", "transcript_done"):
        transcript_id = _extract_transcript_id(body)
        if transcript_id and not meeting.recall_transcript_id:
            meeting.recall_transcript_id = transcript_id
        db.commit()
        # Download + normalize + persist segments off the request path, once.
        if meeting.recall_transcript_id and enqueue_job(db, meeting.id, "process_transcript"):
            if background_tasks is not None:
                background_tasks.add_task(run_process_transcript, meeting.id)
        return

    if event_type in ("transcript.failed", "transcript_failed"):
        meeting.status = "failed"
        meeting.processing_error_code = "transcript_failed"
        data = body.get("data") or {}
        meeting.processing_error_message = str(data.get("error") or "Transcription failed at Recall/AssemblyAI.")[:2000]
        db.commit()
        return

    db.commit()


@router.post("/webhooks/recall")
async def recall_webhook(request: Request, background_tasks: BackgroundTasks) -> Response:
    settings = get_settings()
    raw = await request.body()

    secret = settings.recall_workspace_verification_secret
    if not secret:
        # Truthful: we can't verify, so we don't pretend to accept.
        return Response(status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

    if not verify_webhook_signature(secret, request.headers, raw):
        return Response(status_code=status.HTTP_401_UNAUTHORIZED)

    event_id = webhook_event_id(request.headers)
    try:
        body = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        return Response(status_code=status.HTTP_400_BAD_REQUEST)

    db = SessionLocal()
    try:
        # Idempotency: unique (provider, external_event_id). Duplicate delivery → 200 no-op.
        if event_id:
            existing = (
                db.query(WebhookEvent)
                .filter(WebhookEvent.provider == "recall", WebhookEvent.external_event_id == event_id)
                .first()
            )
            if existing:
                return Response(status_code=status.HTTP_200_OK)

        evt = WebhookEvent(
            provider="recall",
            external_event_id=event_id,
            event_type=body.get("event"),
            payload_hash=hashlib.sha256(raw).hexdigest(),
            status="received",
        )
        db.add(evt)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()  # concurrent duplicate
            return Response(status_code=status.HTTP_200_OK)

        apply_event(db, body, background_tasks)
        evt.status = "processed"
        evt.processed_at = datetime.now(timezone.utc)
        db.commit()
    finally:
        db.close()

    return Response(status_code=status.HTTP_200_OK)
