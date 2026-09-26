"""phase 6b people and meeting participants

Additive only: creates `people` and `meeting_participants`, and adds the nullable
`transcript_segments.meeting_participant_id` FK. No data transform, no destructive change —
existing transcript rows stay valid (their new FK is null). No Person is created here; identity
resolution and any historical backfill are deferred to later sub-phases.

Revision ID: c7d1f2a3b4e5
Revises: a1c2e3f4d5b6
Create Date: 2026-09-26 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7d1f2a3b4e5"
down_revision: Union[str, None] = "a1c2e3f4d5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "people",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("owner_user_id", sa.String(), nullable=False),
        sa.Column("display_name", sa.String(), nullable=True),
        sa.Column("primary_email", sa.String(), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_people_owner_user_id"), "people", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_people_primary_email"), "people", ["primary_email"], unique=False)

    op.create_table(
        "meeting_participants",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("meeting_id", sa.String(), nullable=False),
        sa.Column("person_id", sa.String(), nullable=True),
        sa.Column("provider", sa.String(), nullable=True),
        sa.Column("provider_participant_id", sa.String(), nullable=True),
        sa.Column("display_name", sa.String(), nullable=True),
        sa.Column("speaker_label", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["person_id"], ["people.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_meeting_participants_meeting_id"), "meeting_participants", ["meeting_id"], unique=False)
    op.create_index(op.f("ix_meeting_participants_person_id"), "meeting_participants", ["person_id"], unique=False)
    # Partial unique indexes: a stable provider id identifies a participant within a meeting; when
    # absent, the diarization label does. This never collapses two distinct people who merely share
    # a display name (they carry distinct provider ids, so they live in the provider-id index).
    op.create_index(
        "uq_participant_meeting_provider_id",
        "meeting_participants",
        ["meeting_id", "provider_participant_id"],
        unique=True,
        postgresql_where=sa.text("provider_participant_id IS NOT NULL"),
        sqlite_where=sa.text("provider_participant_id IS NOT NULL"),
    )
    op.create_index(
        "uq_participant_meeting_label",
        "meeting_participants",
        ["meeting_id", "speaker_label"],
        unique=True,
        postgresql_where=sa.text("provider_participant_id IS NULL AND speaker_label IS NOT NULL"),
        sqlite_where=sa.text("provider_participant_id IS NULL AND speaker_label IS NOT NULL"),
    )

    # Nullable FK column so existing transcript rows stay valid (their FK is simply null).
    op.add_column("transcript_segments", sa.Column("meeting_participant_id", sa.String(), nullable=True))
    op.create_index(
        op.f("ix_transcript_segments_meeting_participant_id"),
        "transcript_segments",
        ["meeting_participant_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_segment_meeting_participant",
        "transcript_segments",
        "meeting_participants",
        ["meeting_participant_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_segment_meeting_participant", "transcript_segments", type_="foreignkey")
    op.drop_index(op.f("ix_transcript_segments_meeting_participant_id"), table_name="transcript_segments")
    op.drop_column("transcript_segments", "meeting_participant_id")

    op.drop_index("uq_participant_meeting_label", table_name="meeting_participants")
    op.drop_index("uq_participant_meeting_provider_id", table_name="meeting_participants")
    op.drop_index(op.f("ix_meeting_participants_person_id"), table_name="meeting_participants")
    op.drop_index(op.f("ix_meeting_participants_meeting_id"), table_name="meeting_participants")
    op.drop_table("meeting_participants")

    op.drop_index(op.f("ix_people_primary_email"), table_name="people")
    op.drop_index(op.f("ix_people_owner_user_id"), table_name="people")
    op.drop_table("people")
