"""realtime broadcast for meetings

Real-time meeting lifecycle over Supabase Realtime Broadcast (no polling, no custom WS server):

  Recall webhook -> FastAPI -> meetings UPDATE/INSERT -> this AFTER trigger ->
  realtime.broadcast_changes() -> private topic  user:<owner_user_id>:meetings  -> browser

This migration only touches objects owned by our DB role (a function + trigger on public.meetings).
The Realtime *authorization* policy lives on realtime.messages, which is owned by a Supabase admin
role — our pooler `postgres` role can't ALTER/CREATE POLICY there — so that policy is applied
separately via the Supabase SQL editor: see backend/sql/realtime_meetings_policy.sql.

Raw SQL is sent via exec_driver_sql (NOT op.execute) so the `:meetings` topic literal isn't parsed
as a SQLAlchemy bind parameter. Run under the DIRECT_URL owner connection.

Revision ID: bb8358815301
Revises: 9595703e3906
Create Date: 2026-09-20 11:28:38.879935
"""
from typing import Sequence, Union

from alembic import op

revision: str = "bb8358815301"
down_revision: Union[str, None] = "9595703e3906"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_FUNCTION = """
create or replace function public.broadcast_meeting_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.broadcast_changes(
    'user:' || coalesce(new.owner_user_id, old.owner_user_id) || ':meetings',  -- topic
    tg_op,            -- event  (INSERT / UPDATE)
    tg_op,            -- operation
    tg_table_name,    -- table
    tg_table_schema,  -- schema
    new,              -- new record
    old               -- old record
  );
  return null;
end;
$$;
"""

_TRIGGER = """
create trigger trg_broadcast_meeting_change
after insert or update on public.meetings
for each row execute function public.broadcast_meeting_change();
"""


def upgrade() -> None:
    conn = op.get_bind()
    conn.exec_driver_sql(_FUNCTION)
    conn.exec_driver_sql("drop trigger if exists trg_broadcast_meeting_change on public.meetings;")
    conn.exec_driver_sql(_TRIGGER)
    # RLS policy on realtime.messages is applied out-of-band (see module docstring / sql file).


def downgrade() -> None:
    conn = op.get_bind()
    conn.exec_driver_sql("drop trigger if exists trg_broadcast_meeting_change on public.meetings;")
    conn.exec_driver_sql("drop function if exists public.broadcast_meeting_change();")
