-- NoteFlow — Realtime authorization for the private meetings channel.
--
-- Run this in the SUPABASE DASHBOARD → SQL EDITOR (it has the privileges to create policies on
-- realtime.messages; the Alembic role does not — realtime.messages is owned by a Supabase admin).
-- RLS is already enabled on realtime.messages by Supabase Realtime Authorization, so we only add
-- the policy: an authenticated user may receive broadcasts ONLY on their own meetings topic
-- (user:<their auth.uid()>:meetings). Pairs with the public.meetings trigger from Alembic
-- migration bb8358815301.

drop policy if exists noteflow_receive_own_meetings_topic on realtime.messages;

create policy noteflow_receive_own_meetings_topic
on realtime.messages
for select
to authenticated
using (
  (select realtime.topic()) = 'user:' || (select auth.uid())::text || ':meetings'
);
