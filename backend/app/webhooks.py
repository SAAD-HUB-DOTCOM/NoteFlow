"""Recall webhook receiver: verify signature, dedupe, normalize → meeting status.

Kept outside the JWT-protected API; secured by Recall signature verification (§9). Long work
is deferred to BackgroundTasks (Phase 4 fills in transcript/intelligence); the handler stays
fast and idempotent.
"""
from __future__ import annotations

import hashlib
import json
import logging
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
log = logging.getLogger("noteflow.webhooks")


def _extract_bot_id(body: dict) -> str | None:
    data = body.get("data") or {}
    bot = data.get("bot") if isinstance(data.get("bot"), dict) else {}
    return data.get("bot_id") or (bot or {}).get("id") or body.get("bot_id")


def _extract_status_code(body: dict) -> str | None:
    """Bot status code. Real Recall events carry it in the EVENT NAME (bot.in_call_recording)
    and in data.data.code; legacy shapes used data.status.code. Return the first candidate that
    maps to a known status, else the first present candidate."""
    candidates: list[str] = []
    event = (body.get("event") or "").lower()
    if event.startswith("bot."):
        candidates.append(event[len("bot."):])
    data = body.get("data") or {}
    inner = data.get("data") if isinstance(data.get("data"), dict) else {}
    if isinstance(inner, dict) and inner.get("code"):
        candidates.append(inner["code"])
    st = data.get("status")
    if isinstance(st, dict) and st.get("code"):
        candidates.append(st["code"])
    elif isinstance(st, str):
        candidates.append(st)
    for c in candidates:
        if map_bot_status(c):
            return c
    return candidates[0] if candidates else None


def _extract_recording_id(body: dict) -> str | None:
    """The RECORDING id (never the bot id). Checks the documented shapes + one level of nesting."""
    data = body.get("data") or {}
    rec = data.get("recording") if isinstance(data.get("recording"), dict) else {}
    inner = data.get("data") if isinstance(data.get("data"), dict) else {}
    inner_rec = inner.get("recording") if isinstance(inner.get("recording"), dict) else {}
    return (
        (rec or {}).get("id")
        or data.get("recording_id")
        or (inner_rec or {}).get("id")
        or inner.get("recording_id")
    )


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
    """OPPORTUNISTIC only — Recall's documented recording.done payload guarantees the recording
    id/status/bot id, NOT started_at/ended_at/duration. So this never assumes those fields exist:
    it populates them purely if a future/variant payload happens to include parseable values, and
    otherwise leaves them null (a later phase can source them reliably). No new scope/webhooks.
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
    event_type = (body.get("event") or "").lower()
    bot_id = _extract_bot_id(body)
    if not bot_id:
        log.warning("recall event=%s has no bot id; data keys=%s", event_type, list((body.get("data") or {}).keys()))
        return
    meeting = db.query(Meeting).filter(Meeting.recall_bot_id == bot_id).first()
    if meeting is None:
        log.warning("recall event=%s bot_id=%s matched no meeting", event_type, bot_id)
        return
    log.info("recall event=%s meeting_id=%s status=%s", event_type, meeting.id, meeting.status)
    code = _extract_status_code(body)
    mapped = map_bot_status(code) if code else None
    if mapped:
        meeting.status = mapped

    if event_type in ("recording.done", "bot.recording_done", "recording_done"):
        recording_id = _extract_recording_id(body)
        if not recording_id:
            data = body.get("data") or {}
            rec = data.get("recording") if isinstance(data.get("recording"), dict) else {}
            log.warning(
                "recording.done meeting_id=%s: could not extract recording id; data keys=%s recording keys=%s",
                meeting.id, list(data.keys()), list((rec or {}).keys()),
            )
        elif not meeting.recall_recording_id:
            meeting.recall_recording_id = recording_id
        _apply_recording_times(meeting, body)
        meeting.status = "transcribing"
        db.commit()
        # Kick off the async transcript creation once, idempotently. The job reconciles the
        # recording id from the bot object if the payload didn't carry it.
        created = enqueue_job(db, meeting.id, "create_transcript")
        log.info(
            "recording.done meeting_id=%s recording_id=%s create_transcript enqueued=%s",
            meeting.id, meeting.recall_recording_id, created,
        )
        if created and background_tasks is not None:
            background_tasks.add_task(run_create_transcript, meeting.id)
        return

    if event_type in ("transcript.processing", "transcript_processing"):
        meeting.status = "transcribing"
        db.commit()
        log.info("transcript.processing meeting_id=%s", meeting.id)
        return

    if event_type in ("transcript.done", "transcript_done"):
        transcript_id = _extract_transcript_id(body)
        if transcript_id and not meeting.recall_transcript_id:
            meeting.recall_transcript_id = transcript_id
        db.commit()
        created = False
        if meeting.recall_transcript_id:
            created = enqueue_job(db, meeting.id, "process_transcript")
            if created and background_tasks is not None:
                background_tasks.add_task(run_process_transcript, meeting.id)
        log.info(
            "transcript.done meeting_id=%s transcript_id=%s process enqueued=%s",
            meeting.id, meeting.recall_transcript_id, created,
        )
        return

    if event_type in ("transcript.failed", "transcript_failed"):
        meeting.status = "failed"
        meeting.processing_error_code = "transcript_failed"
        data = body.get("data") or {}
        meeting.processing_error_message = str(data.get("error") or "Transcription failed at Recall/AssemblyAI.")[:2000]
        db.commit()
        log.warning("transcript.failed meeting_id=%s", meeting.id)
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
