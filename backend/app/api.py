"""API v1 routes — Phase 1 (health, me, preferences). Capture/webhooks land in Phase 3."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db import get_db
from app.models import Profile, UserPreferences
from app.schemas import HealthOut, MeOut, MeUpdate, PreferencesOut, PreferencesUpdate
from app.security import CurrentUser, get_current_user

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
