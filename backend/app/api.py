"""API v1 routes — Phase 1 (health, me, preferences). Capture/webhooks land in Phase 3."""
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db import get_db
from app.models import Meeting, Profile, TranscriptSegment, UserPreferences
from app.schemas import (
    CaptureIn,
    HealthOut,
    MeetingOut,
    MeetingTranscriptOut,
    MeOut,
    MeUpdate,
    PreferencesOut,
    PreferencesUpdate,
    TranscriptSegmentOut,
)
from app.security import CurrentUser, get_current_user
from app.services.recall import (
    RecallNotConfigured,
    get_recall_service,
    provider_from_url,
)

router = APIRouter()


@router.get("/health", response_model=HealthOut, tags=["system"])
def health(settings: Settings = Depends(get_settings)) -> HealthOut:
    return HealthOut(
        status="ok",
        environment=settings.environment,
        database_configured=bool(settings.database_url),
        auth_configured=bool(settings.supabase_jwt_secret),
        recall_configured=bool(settings.recall_api_key),
        groq_configured=bool(settings.groq_api_key),
    )


def _get_or_create_profile(db: Session, user: CurrentUser) -> Profile:
    profile = db.get(Profile, user.id)
    if profile is None:
        profile = Profile(id=user.id)
        db.add(profile)
        db.add(UserPreferences(user_id=user.id))
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/me", response_model=MeOut, tags=["user"])
def get_me(
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeOut:
    profile = _get_or_create_profile(db, user)
    return MeOut(
        id=user.id,
        email=user.email,
        display_name=profile.display_name,
        avatar_url=profile.avatar_url,
        timezone=profile.timezone,
    )


@router.patch("/me", response_model=MeOut, tags=["user"])
def update_me(
    payload: MeUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeOut:
    profile = _get_or_create_profile(db, user)
    if payload.display_name is not None:
        profile.display_name = payload.display_name
    if payload.timezone is not None:
        profile.timezone = payload.timezone
    db.commit()
    db.refresh(profile)
    return MeOut(
        id=user.id,
        email=user.email,
        display_name=profile.display_name,
        avatar_url=profile.avatar_url,
        timezone=profile.timezone,
    )


@router.get("/preferences", response_model=PreferencesOut, tags=["user"])
def get_preferences(
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PreferencesOut:
    _get_or_create_profile(db, user)
    prefs = db.get(UserPreferences, user.id)
    return PreferencesOut(
        default_capture_enabled=prefs.default_capture_enabled,
        default_summary_template=prefs.default_summary_template,
        recording_notice_enabled=prefs.recording_notice_enabled,
    )


@router.patch("/preferences", response_model=PreferencesOut, tags=["user"])
def update_preferences(
    payload: PreferencesUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PreferencesOut:
    _get_or_create_profile(db, user)
    prefs = db.get(UserPreferences, user.id)
    if payload.default_capture_enabled is not None:
        prefs.default_capture_enabled = payload.default_capture_enabled
    if payload.default_summary_template is not None:
        prefs.default_summary_template = payload.default_summary_template
    if payload.recording_notice_enabled is not None:
        prefs.recording_notice_enabled = payload.recording_notice_enabled
    db.commit()
    db.refresh(prefs)
    return PreferencesOut(
        default_capture_enabled=prefs.default_capture_enabled,
        default_summary_template=prefs.default_summary_template,
        recording_notice_enabled=prefs.recording_notice_enabled,
    )


# ── Meetings (Phase 3: manual Recall capture) ──────────────────────────────────

@router.post("/meetings/capture", response_model=MeetingOut, tags=["meetings"])
def capture_meeting(
    payload: CaptureIn,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Meeting:
    """Send a NoteFlow bot to a pasted meeting URL (manual/impromptu capture)."""
    provider = provider_from_url(payload.meeting_url)
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported meeting link. Use a Google Meet, Zoom, or Microsoft Teams URL.",
        )
    try:
        recall = get_recall_service(settings.recall_api_key, settings.recall_region)
    except RecallNotConfigured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Meeting capture isn't configured yet (RECALL_API_KEY missing).",
        )

    meeting = Meeting(
        owner_user_id=user.id,
        title=payload.title,
        source="manual",
        provider=provider,
        meeting_url=payload.meeting_url,
        status="draft",
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    try:
        bot = recall.create_bot(payload.meeting_url)
    except httpx.HTTPStatusError as exc:
        meeting.status = "failed"
        meeting.processing_error_code = "recall_create_bot"
        meeting.processing_error_message = f"Recall responded {exc.response.status_code}"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Couldn't start the NoteFlow bot for this meeting.",
        )
    except httpx.HTTPError as exc:
        meeting.status = "failed"
        meeting.processing_error_code = "recall_unreachable"
        meeting.processing_error_message = str(exc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Couldn't reach Recall to start the bot.",
        )

    meeting.recall_bot_id = bot.get("id")
    meeting.status = "joining"
    db.commit()
    db.refresh(meeting)
    return meeting


@router.get("/meetings", response_model=list[MeetingOut], tags=["meetings"])
def list_meetings(
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Meeting]:
    return (
        db.query(Meeting)
        .filter(Meeting.owner_user_id == user.id)
        .order_by(Meeting.created_at.desc())
        .all()
    )


@router.get("/meetings/{meeting_id}", response_model=MeetingOut, tags=["meetings"])
def get_meeting(
    meeting_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Meeting:
    meeting = db.get(Meeting, meeting_id)
    if meeting is None or meeting.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    return meeting


@router.get(
    "/meetings/{meeting_id}/transcript",
    response_model=MeetingTranscriptOut,
    tags=["meetings"],
)
def get_meeting_transcript(
    meeting_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeetingTranscriptOut:
    """The real, persisted transcript for a meeting (owner-scoped). Empty until processing lands."""
    meeting = db.get(Meeting, meeting_id)
    if meeting is None or meeting.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    rows = (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.meeting_id == meeting_id)
        .order_by(TranscriptSegment.sequence)
        .all()
    )
    segments = [
        TranscriptSegmentOut(
            id=r.id,
            speaker=r.speaker_label,
            text=r.text,
            start=r.start_ms / 1000.0,
            end=r.end_ms / 1000.0,
            sequence=r.sequence,
        )
        for r in rows
    ]
    return MeetingTranscriptOut(meeting_id=meeting.id, status=meeting.status, segments=segments)
