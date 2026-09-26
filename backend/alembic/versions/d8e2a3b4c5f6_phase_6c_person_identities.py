"""phase 6c person identities

Additive only: creates `person_identities`, the trustworthy identity-evidence table backing
conservative cross-meeting resolution. No changes to existing tables (MeetingParticipant.person_id
already exists from 6B). Existing data stays valid.

Revision ID: d8e2a3b4c5f6
Revises: c7d1f2a3b4e5
Create Date: 2026-09-26 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d8e2a3b4c5f6"
down_revision: Union[str, None] = "c7d1f2a3b4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "person_identities",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("owner_user_id", sa.String(), nullable=False),
        sa.Column("person_id", sa.String(), nullable=False),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False, server_default=""),
        sa.Column("value", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False, server_default="ingestion"),
        sa.Column("confidence", sa.String(), nullable=False, server_default="high"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["person_id"], ["people.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        # One piece of evidence maps to exactly one Person per owner — the guard against silent merges.
        sa.UniqueConstraint("owner_user_id", "kind", "provider", "value", name="uq_person_identity_owner_key"),
    )
    op.create_index(op.f("ix_person_identities_owner_user_id"), "person_identities", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_person_identities_person_id"), "person_identities", ["person_id"], unique=False)
    op.create_index("ix_person_identity_lookup", "person_identities",
                    ["owner_user_id", "kind", "provider", "value"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_person_identity_lookup", table_name="person_identities")
    op.drop_index(op.f("ix_person_identities_person_id"), table_name="person_identities")
    op.drop_index(op.f("ix_person_identities_owner_user_id"), table_name="person_identities")
    op.drop_table("person_identities")
