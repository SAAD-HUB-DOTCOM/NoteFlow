"""API v1 routes — Phase 1 (health, me, preferences). Capture/webhooks land in Phase 3."""
import secrets

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db import get_db
from app.models import (
    Meeting,
    MeetingIntelligence,
    Person,
    Profile,
    TranscriptSegment,
    UserPreferences,
)
from app.services import people as people_service
from app.services.aggregates import list_action_items, list_highlights
from app.schemas import (
    ActionItemOut,
    AskAllOut,
    AskIn,
    AskOut,
    CaptureIn,
    HealthOut,
    HighlightOut,
    LinkParticipantIn,
    MeetingIntelligenceOut,
    MeetingOut,
    MeetingTranscriptOut,
    MeOut,
    MeUpdate,
    MergePeopleIn,
    PersonCreateIn,
    PersonDetailOut,
    PersonMeetingOut,
    PersonOut,
    PreferencesOut,
    PreferencesUpdate,
    RecordingOut,
    ShareOut,
    SharedMeetingOut,
    TranscriptSegmentOut,
)
from app.security import CurrentUser, get_current_user
from app.services.recall import (
    RecallNotConfigured,
    extract_recording_playback,
    get_recall_service,
    provider_from_url,
)
from app.services.intelligence import (
    GroqNotConfigured,
    answer_across_meetings,
    answer_question,
    generate_intelligence,
)
from app.services.transcription import enqueue_job, run_create_transcript

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

    provider_names = {"google_meet": "Google Meet", "zoom": "Zoom", "teams": "Microsoft Teams"}
    default_title = f"{provider_names.get(provider, 'Meeting')} meeting"
    meeting = Meeting(
        owner_user_id=user.id,
        title=payload.title or default_title,
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


@router.post("/ask", response_model=AskAllOut, tags=["meetings"])
def ask_all_meetings(
    payload: AskIn,
    user: CurrentUser = Depends(get_current_user),
) -> AskAllOut:
    """Ask NoteFlow across ALL of the signed-in user's meetings, grounded in their real transcripts.

    Groq answers only from the user's own transcripts; citations are validated to real segments and
    carry their meeting so the UI can link back. The Groq credential never reaches the browser.
    """
    question = (payload.question or "").strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Ask a question first."
        )
    try:
        result = answer_across_meetings(user.id, question)
    except GroqNotConfigured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ask NoteFlow isn't configured yet (GROQ_API_KEY missing).",
        )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Couldn't reach the answer service. Try again in a moment.",
        )
    return AskAllOut(**result)


@router.get("/action-items", response_model=list[ActionItemOut], tags=["meetings"])
def get_action_items(
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Every action item NoteFlow extracted across the user's meetings (owner-scoped, real data)."""
    return list_action_items(db, user.id)


@router.get("/highlights", response_model=list[HighlightOut], tags=["meetings"])
def get_highlights(
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Key moments NoteFlow auto-detected across the user's meetings (owner-scoped, real data)."""
    return list_highlights(db, user.id)


@router.post("/meetings/{meeting_id}/share", response_model=ShareOut, tags=["meetings"])
def share_meeting(
    meeting_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShareOut:
    """Create (or return) a public, read-only share link for a meeting (owner-scoped).

    Mints an unguessable token; the token is the only thing needed to read the meeting publicly, so
    treat the link as a capability. Idempotent — re-sharing returns the existing token.
    """
    meeting = db.get(Meeting, meeting_id)
    if meeting is None or meeting.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    if not meeting.share_id:
        meeting.share_id = secrets.token_urlsafe(16)
        db.commit()
    return ShareOut(meeting_id=meeting.id, share_id=meeting.share_id)


@router.delete("/meetings/{meeting_id}/share", response_model=ShareOut, tags=["meetings"])
def unshare_meeting(
    meeting_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShareOut:
    """Revoke a meeting's public share link (owner-scoped). The old link stops working immediately."""
    meeting = db.get(Meeting, meeting_id)
    if meeting is None or meeting.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    meeting.share_id = None
    db.commit()
    return ShareOut(meeting_id=meeting.id, share_id=None)


@router.get("/shared/{share_id}", response_model=SharedMeetingOut, tags=["public"])
def get_shared_meeting(
    share_id: str,
    db: Session = Depends(get_db),
) -> SharedMeetingOut:
    """PUBLIC read-only view of a shared meeting — no authentication.

    Looked up only by the unguessable share token; revoked meetings (share_id cleared) 404. Never
    exposes the owner's identity, the meeting URL, or any account data.
    """
    meeting = db.query(Meeting).filter(Meeting.share_id == share_id).first()
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This shared link isn’t available.")
    rows = (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.meeting_id == meeting.id)
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
    intel = db.get(MeetingIntelligence, meeting.id)
    return SharedMeetingOut(
        title=meeting.title,
        started_at=meeting.started_at,
        duration_seconds=meeting.duration_seconds,
        segments=segments,
        intelligence=intel.content if intel else None,
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


@router.post("/meetings/{meeting_id}/reprocess", response_model=MeetingOut, tags=["meetings"])
def reprocess_meeting(
    meeting_id: str,
    background_tasks: BackgroundTasks,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Meeting:
    """Manually re-run the transcription pipeline for a stuck meeting (owner-scoped).

    Reconciles the recording id from Recall if missing, re-creates the async transcript, and
    re-processes it. Safe to call repeatedly — jobs are forced back to pending, and segment
    persistence is idempotent.
    """
    meeting = db.get(Meeting, meeting_id)
    if meeting is None or meeting.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    if not meeting.recall_bot_id:
        raise HTTPException(status_code=422, detail="This meeting has no bot to reprocess.")
    meeting.status = "transcribing"
    meeting.processing_error_code = None
    meeting.processing_error_message = None
    db.commit()
    enqueue_job(db, meeting.id, "create_transcript", force=True)
    background_tasks.add_task(run_create_transcript, meeting.id)
    db.refresh(meeting)
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


@router.get(
    "/meetings/{meeting_id}/recording",
    response_model=RecordingOut,
    tags=["meetings"],
)
def get_meeting_recording(
    meeting_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RecordingOut:
    """Fresh Recall mixed-recording playback URL for a meeting (owner-scoped).

    The URL is presigned + expiring, so it's fetched live from Recall on each request and never
    persisted. Returns `ready` (url present), `processing` (recording not finalized), or
    `unavailable` (no bot/recording). The Recall API key never reaches the browser.
    """
    meeting = db.get(Meeting, meeting_id)
    if meeting is None or meeting.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    if not meeting.recall_bot_id:
        return RecordingOut(
            meeting_id=meeting.id,
            status="unavailable",
            duration_seconds=meeting.duration_seconds,
        )
    try:
        recall = get_recall_service(settings.recall_api_key, settings.recall_region)
    except RecallNotConfigured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Recording playback isn't configured yet (RECALL_API_KEY missing).",
        )
    try:
        bot = recall.get_bot(meeting.recall_bot_id)
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Couldn't reach Recall to load the recording.",
        )
    playback = extract_recording_playback(bot)
    return RecordingOut(
        meeting_id=meeting.id,
        status=playback["status"],
        media_type=playback["media_type"],
        url=playback["url"],
        duration_seconds=meeting.duration_seconds,
    )


@router.post("/meetings/{meeting_id}/ask", response_model=AskOut, tags=["meetings"])
def ask_meeting(
    meeting_id: str,
    payload: AskIn,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AskOut:
    """Ask a question about ONE meeting, grounded in its real transcript (owner-scoped).

    Groq answers only from the supplied transcript; citations are validated to real segment ids
    (invented ones dropped). The Groq credential never reaches the browser.
    """
    meeting = db.get(Meeting, meeting_id)
    if meeting is None or meeting.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    question = (payload.question or "").strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Ask a question first."
        )
    try:
        result = answer_question(meeting_id, question)
    except GroqNotConfigured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ask NoteFlow isn't configured yet (GROQ_API_KEY missing).",
        )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Couldn't reach the answer service. Try again in a moment.",
        )
    if result is None:
        return AskOut(answer="This meeting has no transcript to answer from yet.", citations=[])
    return AskOut(**result)


@router.get(
    "/meetings/{meeting_id}/intelligence",
    response_model=MeetingIntelligenceOut,
    tags=["meetings"],
)
def get_meeting_intelligence(
    meeting_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeetingIntelligenceOut:
    """Real Groq-generated intelligence (owner-scoped). `generating` while the transcript exists
    but insights aren't ready yet; `unavailable` if there's no transcript to summarize."""
    meeting = db.get(Meeting, meeting_id)
    if meeting is None or meeting.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    row = db.get(MeetingIntelligence, meeting_id)
    if row is not None:
        return MeetingIntelligenceOut(meeting_id=meeting_id, state="ready", content=row.content)
    has_transcript = (
        db.query(TranscriptSegment).filter(TranscriptSegment.meeting_id == meeting_id).count() > 0
    )
    return MeetingIntelligenceOut(
        meeting_id=meeting_id,
        state="generating" if has_transcript else "unavailable",
        content=None,
    )


@router.post(
    "/meetings/{meeting_id}/intelligence",
    response_model=MeetingIntelligenceOut,
    tags=["meetings"],
)
def regenerate_meeting_intelligence(
    meeting_id: str,
    background_tasks: BackgroundTasks,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeetingIntelligenceOut:
    """On-demand (re)generation of meeting intelligence. Because generation otherwise only runs
    once at transcript-processing time (best-effort), meetings processed before that code existed —
    or where the one Groq attempt failed — would be stuck reporting `generating` forever. This
    schedules the idempotent generator so the row backfills; the client keeps polling GET until
    `ready`. Owner-scoped; no-op when a row already exists or there's no transcript."""
    meeting = db.get(Meeting, meeting_id)
    if meeting is None or meeting.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    row = db.get(MeetingIntelligence, meeting_id)
    if row is not None:
        return MeetingIntelligenceOut(meeting_id=meeting_id, state="ready", content=row.content)
    has_transcript = (
        db.query(TranscriptSegment).filter(TranscriptSegment.meeting_id == meeting_id).count() > 0
    )
    if not has_transcript:
        return MeetingIntelligenceOut(meeting_id=meeting_id, state="unavailable", content=None)
    background_tasks.add_task(generate_intelligence, meeting_id)
    return MeetingIntelligenceOut(meeting_id=meeting_id, state="generating", content=None)


# ── People (Phase 6C) ────────────────────────────────────────────────────────────
#
# Cross-meeting identities resolved from trustworthy evidence only (see services/people.py).
# Every route is owner-scoped: a user can never read, create, link, unlink, or merge another
# owner's people or participants — an owner mismatch is an indistinguishable 404.

def _person_out(person: Person, count: int, last_at) -> PersonOut:
    return PersonOut(
        id=person.id,
        display_name=person.display_name,
        email=person.primary_email,
        avatar_url=person.avatar_url,
        conversation_count=count,
        last_conversation_at=last_at,
    )


def _person_detail(db: Session, user: CurrentUser, person: Person) -> PersonDetailOut:
    meetings = people_service.person_meetings(db, user.id, person)
    last_at = max((m.started_at or m.created_at for m in meetings), default=None)
    return PersonDetailOut(
        id=person.id,
        display_name=person.display_name,
        email=person.primary_email,
        avatar_url=person.avatar_url,
        conversation_count=len(meetings),
        last_conversation_at=last_at,
        meetings=[PersonMeetingOut.model_validate(m) for m in meetings],
    )


@router.get("/people", response_model=list[PersonOut], tags=["people"])
def list_people(
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PersonOut]:
    """The owner's resolved people, most-recent conversation first. Only people with at least one
    linked conversation appear; email/avatar are present only when actually known."""
    return [_person_out(p, count, last_at) for p, count, last_at in people_service.list_people(db, user.id)]


@router.post("/people", response_model=PersonDetailOut, tags=["people"])
def create_person(
    payload: PersonCreateIn,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PersonDetailOut:
    """Create a person for the owner, optionally seeded from (and linked to) an observed
    participant — the reliable way to establish an identity today."""
    try:
        person = people_service.create_person(
            db, user.id,
            meeting_participant_id=payload.meeting_participant_id,
            display_name=payload.display_name,
        )
    except people_service.NotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found.")
    db.commit()
    db.refresh(person)
    return _person_detail(db, user, person)


@router.get("/people/{person_id}", response_model=PersonDetailOut, tags=["people"])
def get_person(
    person_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PersonDetailOut:
    try:
        person = people_service._owned_person(db, user.id, person_id)
    except people_service.NotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found.")
    return _person_detail(db, user, person)


@router.post("/people/{person_id}/link-participant", response_model=PersonDetailOut, tags=["people"])
def link_participant(
    person_id: str,
    payload: LinkParticipantIn,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PersonDetailOut:
    """Manually associate an observed participant with this person (owner-scoped)."""
    try:
        person = people_service.link_participant_to_person(
            db, user.id, payload.meeting_participant_id, person_id
        )
    except people_service.NotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person or participant not found.")
    db.commit()
    db.refresh(person)
    return _person_detail(db, user, person)


@router.post("/people/{person_id}/unlink-participant", response_model=PersonDetailOut, tags=["people"])
def unlink_participant(
    person_id: str,
    payload: LinkParticipantIn,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PersonDetailOut:
    """Detach a participant from this person (owner-scoped). Raw participant data is preserved."""
    try:
        person = people_service._owned_person(db, user.id, person_id)
        people_service.unlink_participant(db, user.id, payload.meeting_participant_id)
    except people_service.NotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person or participant not found.")
    db.commit()
    db.refresh(person)
    return _person_detail(db, user, person)


@router.post("/people/{person_id}/merge", response_model=PersonDetailOut, tags=["people"])
def merge_person(
    person_id: str,
    payload: MergePeopleIn,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PersonDetailOut:
    """Merge `source_person_id` into `{person_id}` (target). Every meeting association is preserved
    and the emptied source is removed. Owner-scoped."""
    try:
        target = people_service.merge_people(db, user.id, payload.source_person_id, person_id)
    except people_service.NotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found.")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    db.commit()
    db.refresh(target)
    return _person_detail(db, user, target)
