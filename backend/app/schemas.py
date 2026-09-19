"""Pydantic v2 request/response schemas."""
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
