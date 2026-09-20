"""SQLAlchemy models — Phase 1 spine (auth/meeting/jobs/webhooks).

Transcript segments, action items, summaries, participants, highlights, shares are added in
their own phases (§7); the schema here is the foundation the capture slice builds on. Meeting
uses a real status lifecycle string (§6), never a boolean.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Profile(TimestampMixin, Base):
    __tablename__ = "profiles"
    # Equals auth.users.id (Supabase). Set on first authenticated request.
    id: Mapped[str] = mapped_column(String, primary_key=True)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    timezone: Mapped[str | None] = mapped_column(String, nullable=True)
    onboarded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class UserPreferences(TimestampMixin, Base):
    __tablename__ = "user_preferences"
    user_id: Mapped[str] = mapped_column(String, primary_key=True)
    default_capture_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    default_summary_template: Mapped[str] = mapped_column(String, default="general")
    recording_notice_enabled: Mapped[bool] = mapped_column(Boolean, default=True)


# Normalized meeting lifecycle (§6). Adapt names to Recall's real events as needed.
MEETING_STATUSES = (
    "draft", "scheduled", "bot_scheduled", "joining", "in_waiting_room", "recording",
    "recording_complete", "transcribing", "generating_intelligence", "ready", "failed", "cancelled",
)


class Meeting(TimestampMixin, Base):
    __tablename__ = "meetings"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    owner_user_id: Mapped[str] = mapped_column(String, index=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    source: Mapped[str] = mapped_column(String, default="manual")  # manual | calendar
    provider: Mapped[str | None] = mapped_column(String, nullable=True)  # google_meet|zoom|teams|unknown
    meeting_url: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="draft", index=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recall_bot_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    recall_recording_id: Mapped[str | None] = mapped_column(String, nullable=True)
    recall_transcript_id: Mapped[str | None] = mapped_column(String, nullable=True)
    processing_error_code: Mapped[str | None] = mapped_column(String, nullable=True)
    processing_error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    jobs: Mapped[list["Job"]] = relationship(back_populates="meeting", cascade="all, delete-orphan")
    transcript_segments: Mapped[list["TranscriptSegment"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )


class Job(TimestampMixin, Base):
    """Async work tracked for observability (FastAPI BackgroundTasks execute these tonight).

    Unique (meeting_id, type): at most one job of a kind per meeting — the idempotency guard so
    duplicate webhook deliveries can't start duplicate transcript work.
    """
    __tablename__ = "jobs"
    __table_args__ = (UniqueConstraint("meeting_id", "type", name="uq_job_meeting_type"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    meeting_id: Mapped[str | None] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=True)
    type: Mapped[str] = mapped_column(String)  # e.g. create_final_transcript, generate_intelligence
    status: Mapped[str] = mapped_column(String, default="pending")  # pending|running|succeeded|failed
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    meeting: Mapped["Meeting | None"] = relationship(back_populates="jobs")


class TranscriptSegment(TimestampMixin, Base):
    """A normalized diarized transcript line (Phase 4).

    Times are milliseconds from the recording origin (source native); the API converts to
    seconds for the frontend's seekTo. Unique (meeting_id, sequence) makes segment persistence
    idempotent — a re-run can't create duplicate rows.
    """
    __tablename__ = "transcript_segments"
    __table_args__ = (
        UniqueConstraint("meeting_id", "sequence", name="uq_segment_meeting_sequence"),
        Index("ix_segment_meeting_sequence", "meeting_id", "sequence"),
    )
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), index=True
    )
    speaker_label: Mapped[str | None] = mapped_column(String, nullable=True)
    text: Mapped[str] = mapped_column(Text)
    start_ms: Mapped[int] = mapped_column(Integer)
    end_ms: Mapped[int] = mapped_column(Integer)
    sequence: Mapped[int] = mapped_column(Integer)
    source: Mapped[str | None] = mapped_column(String, nullable=True)  # e.g. assembly_ai_async

    meeting: Mapped["Meeting"] = relationship(back_populates="transcript_segments")


class WebhookEvent(TimestampMixin, Base):
    """Recall webhook idempotency + audit (§9)."""
    __tablename__ = "webhook_events"
    __table_args__ = (UniqueConstraint("provider", "external_event_id", name="uq_webhook_provider_event"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    provider: Mapped[str] = mapped_column(String, default="recall")
    external_event_id: Mapped[str | None] = mapped_column(String, nullable=True)
    event_type: Mapped[str | None] = mapped_column(String, nullable=True)
    payload_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="received")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
