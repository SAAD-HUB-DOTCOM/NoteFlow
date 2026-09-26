import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
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


MEETING_STATUSES = (
    "draft", "scheduled", "bot_scheduled", "joining", "in_waiting_room", "recording",
    "recording_complete", "transcribing", "generating_intelligence", "ready", "failed", "cancelled",
)


class Meeting(TimestampMixin, Base):
    __tablename__ = "meetings"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    owner_user_id: Mapped[str] = mapped_column(String, index=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    source: Mapped[str] = mapped_column(String, default="manual") 
    provider: Mapped[str | None] = mapped_column(String, nullable=True)  
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
    share_id: Mapped[str | None] = mapped_column(String, nullable=True, unique=True, index=True)

    jobs: Mapped[list["Job"]] = relationship(back_populates="meeting", cascade="all, delete-orphan")
    transcript_segments: Mapped[list["TranscriptSegment"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )
    participants: Mapped[list["MeetingParticipant"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )


class Job(TimestampMixin, Base):
    __tablename__ = "jobs"
    __table_args__ = (UniqueConstraint("meeting_id", "type", name="uq_job_meeting_type"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    meeting_id: Mapped[str | None] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), nullable=True)
    type: Mapped[str] = mapped_column(String)  
    status: Mapped[str] = mapped_column(String, default="pending") 
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
    # Immutable raw diarization label from the transcript artifact — the source of truth for who
    # spoke this line. Phase 6B links it (best-effort) to an observed MeetingParticipant but NEVER
    # overwrites this string; if linking fails, speaker_label stands alone and the FK stays null.
    speaker_label: Mapped[str | None] = mapped_column(String, nullable=True)
    text: Mapped[str] = mapped_column(Text)
    start_ms: Mapped[int] = mapped_column(Integer)
    end_ms: Mapped[int] = mapped_column(Integer)
    sequence: Mapped[int] = mapped_column(Integer)
    source: Mapped[str | None] = mapped_column(String, nullable=True)
    meeting_participant_id: Mapped[str | None] = mapped_column(
        ForeignKey("meeting_participants.id", ondelete="SET NULL"), nullable=True, index=True
    )
    meeting: Mapped["Meeting"] = relationship(back_populates="transcript_segments")
    participant: Mapped["MeetingParticipant | None"] = relationship(back_populates="segments")


class Person(TimestampMixin, Base):
    """A resolved cross-meeting identity, owner-scoped (Phase 6B foundation).

    A Person is created ONLY when a trustworthy identity exists or the owner confirms one — never
    automatically from a speaker label or display name during ingestion (that is 6C's job). In 6B
    no Person rows are created by the pipeline; observed participants keep person_id = null.
    Owner scoping mirrors Meeting: an owner_user_id column + explicit filtering at the API layer.
    """
    __tablename__ = "people"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    owner_user_id: Mapped[str] = mapped_column(String, index=True)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    primary_email: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)

    participants: Mapped[list["MeetingParticipant"]] = relationship(back_populates="person")
    identities: Mapped[list["PersonIdentity"]] = relationship(
        back_populates="person", cascade="all, delete-orphan"
    )


class PersonIdentity(TimestampMixin, Base):
    """Trustworthy identity evidence that maps a real signal to a Person (Phase 6C).

    Resolution matches an observed participant against these rows — a stable provider participant
    id, a normalized email, or an explicit manual association. A matching display name / speaker
    label is NEVER stored here and never resolves identity. Owner-scoped and uniquely keyed so one
    piece of evidence maps to exactly one Person per owner (the guard against silent cross-identity
    merges). `provider` namespaces provider-id evidence; it is "" for email/manual kinds.
    """
    __tablename__ = "person_identities"
    __table_args__ = (
        UniqueConstraint("owner_user_id", "kind", "provider", "value", name="uq_person_identity_owner_key"),
        Index("ix_person_identity_lookup", "owner_user_id", "kind", "provider", "value"),
    )
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    owner_user_id: Mapped[str] = mapped_column(String, index=True)
    person_id: Mapped[str] = mapped_column(ForeignKey("people.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String)  # 'provider_participant_id' | 'email' | 'manual'
    provider: Mapped[str] = mapped_column(String, default="")  # platform namespace; "" when N/A
    value: Mapped[str] = mapped_column(String)
    source: Mapped[str] = mapped_column(String, default="ingestion")  # 'ingestion' | 'manual'
    confidence: Mapped[str] = mapped_column(String, default="high")

    person: Mapped["Person"] = relationship(back_populates="identities")


class MeetingParticipant(TimestampMixin, Base):
    """An OBSERVED participant in ONE meeting (Phase 6B). Not an identity — a raw observation
    sourced from the transcript artifact's participant metadata (or its diarization label).

    person_id is nullable BY DESIGN: most observations don't resolve to a Person in 6B, and that is
    correct. Uniqueness is per-meeting and never collapses two distinct people who merely share a
    display name:
      - when the provider gives a stable participant id, identity is (meeting_id, provider_participant_id);
      - otherwise the diarization label is the per-meeting identity: (meeting_id, speaker_label).
    Two partial unique indexes encode exactly that, so a name collision with distinct provider ids
    stays two rows.
    """
    __tablename__ = "meeting_participants"
    __table_args__ = (
        Index(
            "uq_participant_meeting_provider_id",
            "meeting_id", "provider_participant_id",
            unique=True,
            sqlite_where=text("provider_participant_id IS NOT NULL"),
            postgresql_where=text("provider_participant_id IS NOT NULL"),
        ),
        Index(
            "uq_participant_meeting_label",
            "meeting_id", "speaker_label",
            unique=True,
            sqlite_where=text("provider_participant_id IS NULL AND speaker_label IS NOT NULL"),
            postgresql_where=text("provider_participant_id IS NULL AND speaker_label IS NOT NULL"),
        ),
    )
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), index=True
    )
    # Resolved identity — left null in 6B; populated by identity resolution in a later sub-phase.
    person_id: Mapped[str | None] = mapped_column(
        ForeignKey("people.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Context needed to interpret provider_participant_id (the meeting's platform: zoom/meet/teams).
    provider: Mapped[str | None] = mapped_column(String, nullable=True)
    provider_participant_id: Mapped[str | None] = mapped_column(String, nullable=True)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    # Copy of the diarization label observed for this participant (never fabricated).
    speaker_label: Mapped[str | None] = mapped_column(String, nullable=True)
    # Only ever set from a real payload field — never inferred from a name.
    email: Mapped[str | None] = mapped_column(String, nullable=True)

    meeting: Mapped["Meeting"] = relationship(back_populates="participants")
    person: Mapped["Person | None"] = relationship(back_populates="participants")
    segments: Mapped[list["TranscriptSegment"]] = relationship(back_populates="participant")


class MeetingIntelligence(TimestampMixin, Base):
    """Groq-generated meeting intelligence (Phase 5). One row per meeting (PK = meeting_id) →
    generation is idempotent (upsert). `content` holds the validated structured JSON (summary,
    key_points, decisions, action_items, important_moments) with real transcript segment ids."""
    __tablename__ = "meeting_intelligence"
    meeting_id: Mapped[str] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True
    )
    model: Mapped[str] = mapped_column(String)
    content: Mapped[dict] = mapped_column(JSON)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


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
