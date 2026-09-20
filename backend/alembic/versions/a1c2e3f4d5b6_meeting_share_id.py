"""meeting public share_id (sharing)

Revision ID: a1c2e3f4d5b6
Revises: f45402e7c1f4
Create Date: 2026-09-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1c2e3f4d5b6"
down_revision: Union[str, None] = "f45402e7c1f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("meetings", sa.Column("share_id", sa.String(), nullable=True))
    op.create_index("ix_meetings_share_id", "meetings", ["share_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_meetings_share_id", table_name="meetings")
    op.drop_column("meetings", "share_id")
