"""Recall webhook receiver: verify signature, dedupe, normalize → meeting status.

Kept outside the JWT-protected API; secured by Recall signature verification (§9). Long work
is deferred to BackgroundTasks (Phase 4 fills in transcript/intelligence); the handler stays
fast and idempotent.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Request, Response, status
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.db import SessionLocal
from app.models import Meeting, WebhookEvent
from app.services.recall import map_bot_status, verify_webhook_signature, webhook_event_id

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


def apply_event(db, body: dict) -> None:
    """Map a Recall event onto the owning meeting's normalized status."""
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

    # Lifecycle events that kick off async processing (worker wiring lands in Phase 4).
    if event_type in ("recording.done", "bot.recording_done", "recording_done"):
        meeting.status = "transcribing"
    elif event_type in ("transcript.done", "transcript_done"):
        meeting.status = "generating_intelligence"

    db.commit()


@router.post("/webhooks/recall")
async def recall_webhook(request: Request) -> Response:
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

        apply_event(db, body)
        evt.status = "processed"
        evt.processed_at = datetime.now(timezone.utc)
        db.commit()
    finally:
        db.close()

    return Response(status_code=status.HTTP_200_OK)
