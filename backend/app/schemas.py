"""Pydantic v2 request/response schemas."""
from datetime import datetime

from pydantic import BaseModel


class HealthOut(BaseModel):
    status: str
    environment: str
    # Truthful readiness flags so the frontend/onboarding can show real setup state.
    database_configured: bool
    auth_configured: bool
    recall_configured: bool
    groq_configured: bool


class MeOut(BaseModel):
    id: str
    email: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    timezone: str | None = None


class MeUpdate(BaseModel):
    display_name: str | None = None
    timezone: str | None = None


class PreferencesOut(BaseModel):
    default_capture_enabled: bool
    default_summary_template: str
    recording_notice_enabled: bool


class PreferencesUpdate(BaseModel):
    default_capture_enabled: bool | None = None
    default_summary_template: str | None = None
    recording_notice_enabled: bool | None = None


class CaptureIn(BaseModel):
    meeting_url: str
    title: str | None = None


class MeetingOut(BaseModel):
    id: str
    title: str | None
    provider: str | None
    meeting_url: str | None
    status: str
    recall_bot_id: str | None
    started_at: datetime | None
    duration_seconds: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TranscriptSegmentOut(BaseModel):
    id: str
    speaker: str | None
    text: str
    start: float  # seconds (for the frontend seekTo primitive)
    end: float
    sequence: int


class MeetingTranscriptOut(BaseModel):
    meeting_id: str
    status: str
    segments: list[TranscriptSegmentOut]


class MeetingIntelligenceOut(BaseModel):
    meeting_id: str
    # "ready" (content present) | "generating" (transcript ready, insights pending) |
    # "unavailable" (no transcript to summarize)
    state: str
    content: dict | None = None

