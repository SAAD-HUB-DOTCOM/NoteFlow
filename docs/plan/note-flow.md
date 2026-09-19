# NoteFlow — Full-Stack Fathom-Inspired Meeting Intelligence Platform
## Claude Code Master Execution Plan

**Project:** NoteFlow  
**Assignment:** Rebuild the core experience of Fathom.video in a 24-hour take-home assignment.  
**Primary goal:** Ship a real full-stack meeting-intelligence product whose main demo path uses real users, real meetings, real capture, real transcripts, real AI output, real persistence, and real sharing — not fabricated meeting records or hardcoded AI answers.  
**Branding:** Use the NoteFlow brand. Reproduce important product behaviors and interaction patterns discovered during Fathom research, but do not copy Fathom trademarks, logos, proprietary assets, or claim knowledge of Fathom's internal architecture.

---

# ⏱ TONIGHT SCOPE & TIME REALITY (v5 — canonical; read before §0)

> This block overrides anything below it when they conflict. This file is now the single
> source of truth (the former root `PLAN.md` has been deleted). Sections 1–35 remain the
> **north-star architecture**; this block defines what we actually build **tonight**.

**Clock:** the assignment started this afternoon; **~6–7 hours remain, not a fresh 24.** The full
architecture below is a 40–80h effort and will **not** be finished tonight. That is expected.

**Fallback is already secured — do not touch it.** The tag `v1-seeded-submission` (local + origin)
is a deployed, honest, working submission (seeded demo intelligence, clearly disclosed). The real
build moves **forward** from it. If external setup or the real-meeting test cycle eats the clock,
**we submit `v1-seeded-submission` and narrate this real architecture honestly in the walkthrough.**
Never delete that tag; never present seed data as real on the real `/app` path.

**TONIGHT = the thin real vertical slice, in this exact order:**
1. Real Google auth (Supabase) on a deployed `/app` (protected).
2. Real **manual** Recall capture of **one** meeting (paste URL → real bot joins) — first GO/NO-GO.
3. Real recording → real AssemblyAI transcript (via Recall) → persisted segments.
4. Real Groq summary + action items (structured, citation-validated) → persisted.
5. Shown in the **existing** workspace UI (already built — reuse, don't rebuild).

**CUT tonight without hesitation** (north-star, not tonight): calendar automation (Phase 11),
cross-meeting search, summary-template breadth, highlights, real-time transcription, desktop capture,
Microsoft/Outlook, per-recipient/domain sharing, semantic search.

**Stack overrides for tonight (supersede §3/§23):**
- **No Celery/Redis/separate worker.** Use **FastAPI `BackgroundTasks` + a DB `jobs`/status table**
  for async processing and observability. Celery+Redis remains the north-star upgrade, post-slice.
- **No monorepo restructure.** Keep the existing Next app **at the repo root** (`src/`, `package.json`
  at root); add **`backend/`** alongside it. The `frontend/`+`backend/` layout in §27 is north-star only.
- Reuse the existing frontend wholesale (workspace, `seekTo` controller, transcript sync, player,
  panels); tonight only swaps the **data source** from static seed to the API for the captured meeting.

**Human-owned setup is the real critical path** (§34) and runs in parallel with coding: Supabase +
Google OAuth consent + Recall workspace (`ap-northeast-1`) + AssemblyAI-in-Recall + Railway + webhook
tunnel. A real Meet call is required to test capture (~20–40 min per full cycle; expect 1–2 cycles).

**Reachability tags used in §28:** 🟢 TONIGHT · 🟡 STRETCH · 🔵 NORTH-STAR (not tonight).

---

# 0. CLAUDE EXECUTION CONTRACT — READ THIS FIRST

Claude Code must treat this file as the source of truth for implementation.

## Mandatory behavior

1. **Inspect before editing.**
   - Inspect the existing repository, current frontend, docs, `.agent-logs/`, package files, environment examples, and existing implementation before changing anything.
   - Preserve working code unless a change is required by this plan.
   - Preserve `.agent-logs/`, `.claude/`, product research, and Git history.

2. **Work phase-by-phase.**
   - Do not attempt to implement the entire platform in one pass.
   - At the start of each phase:
     - state what already exists,
     - state the objective,
     - list files/tables/endpoints to add or change,
     - identify migration/security implications.
   - At the end of each phase:
     - run relevant lint/type/build/tests,
     - report failures honestly,
     - summarize files changed,
     - stop for review unless explicitly told to continue.

3. **No fake production meeting data.**
   - Do not populate the production UI with fabricated meetings, fake transcripts, fake summaries, fake action items, or hardcoded Ask NoteFlow answers.
   - Test fixtures are allowed only inside tests/dev tooling and must never masquerade as production data.
   - Built-in application configuration such as summary-template definitions is allowed.

4. **No fake integrations.**
   - If Recall, AssemblyAI, Groq, Supabase, Google OAuth, or another external integration is not configured, show a truthful setup/error state.
   - Never silently fall back to fake API responses.

5. **Protect secrets.**
   - Never commit API keys or service-role secrets.
   - Never expose secrets through `NEXT_PUBLIC_*`.
   - Maintain `.env.example` files with placeholder names only.

6. **Production quality over feature count.**
   - A smaller end-to-end path that genuinely works is more important than many partially working features.
   - Never break the core meeting lifecycle to add optional features.

7. **Commit incrementally.**
   - `.agent-logs/` must continue being committed throughout development.
   - Use meaningful `chore:`, `feat:`, `fix:`, `test:`, `docs:` commits.

---

# 1. PRODUCT DEFINITION

NoteFlow is a full-stack AI meeting notetaker.

A real user should be able to:

1. Visit a polished public NoteFlow landing page.
2. Sign up/sign in using Google.
3. Complete onboarding.
4. Connect a Google Calendar (and later Microsoft Outlook).
5. See upcoming supported video meetings.
6. Turn NoteFlow recording on/off per meeting and set a default capture preference.
7. For an impromptu meeting, paste a Google Meet/Zoom/Teams URL and send a NoteFlow notetaker.
8. Have a real Recall.ai meeting bot join the meeting and capture the meeting.
9. Have the completed recording transcribed with real speaker/timestamp data.
10. Have Groq generate real structured meeting intelligence:
    - summary,
    - key points,
    - decisions,
    - action items,
    - suggested highlights,
    - suggested questions,
    - optional follow-up email.
11. Open the meeting workspace and:
    - play the recording,
    - view a synchronized transcript,
    - click transcript segments to seek playback,
    - search the transcript,
    - view/regenerate summary templates,
    - review action items,
    - ask questions about the meeting with timestamp citations,
    - create highlights,
    - share the meeting externally.
12. Search across their previous meetings.
13. Open public share links without a NoteFlow account when the owner permits it.

The primary submission must demonstrate a **real vertical slice**:

> Google login → real meeting → real Recall capture → real transcript → real Groq intelligence → database persistence → synchronized meeting workspace → Ask NoteFlow → sharing.

---

# 2. WHAT “FATHOM-LIKE” MEANS FOR THIS PROJECT

The implementation should reproduce the highest-value behaviors observed during product research:

- My Meetings / meeting library
- upcoming-meeting awareness
- meeting capture controls
- recording player
- transcript with speakers and timestamps
- playback ↔ transcript synchronization
- structured AI summary
- summary templates
- formal action-items view
- conversational meeting Q&A
- timestamped references back to the source recording
- highlights/moments
- meeting search
- cross-meeting knowledge retrieval
- public sharing/read-only meeting experience

Do **not** assume or claim that NoteFlow uses Fathom's private internal architecture.

## Capture scope for this submission

Current NoteFlow submission scope:
- **Real bot-based capture** for Google Meet, Zoom, and Microsoft Teams through Recall.ai.
- Calendar-triggered bot scheduling.
- Manual/ad-hoc meeting URL capture for testing/spontaneous calls.

Post-submission extension:
- Bot-free local/desktop capture using an Electron desktop app + Recall Desktop Recording SDK.

Do not attempt the desktop capture mode until the web product and real bot-based lifecycle are stable.

---

# 3. TECH STACK — LOCKED

## Frontend

- **Next.js** (existing repo version; do not downgrade/upgrade without need)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** for icons
- Existing component/design system if already present and good
- Supabase JS / SSR package appropriate to the installed Next.js version
- Optional lightweight state management only if React state/context becomes insufficient

## Backend

- **Python 3.11+**
- **FastAPI**
- **Pydantic v2**
- **SQLAlchemy 2.x**
- **Alembic** migrations
- `httpx` for external HTTP APIs
- **Background processing** (see TONIGHT SCOPE override):
  - **Tonight:** FastAPI `BackgroundTasks` + a DB `jobs`/status table (idempotent, retryable,
    observable via meeting status). No Celery/Redis/separate worker.
  - **North-star:** Celery + Redis with a separate worker process for durability/concurrency —
    adopt after the real vertical slice is proven.

## Database/Auth/Storage

- **Supabase**
  - PostgreSQL
  - Supabase Auth
  - Google OAuth for NoteFlow login
  - Row Level Security
  - Supabase Storage for durable recording/media ownership
  - Supabase Realtime where useful for meeting-status UI updates

## Meeting capture/calendar

- **Recall.ai**
  - Meeting Bot API
  - Calendar V2 integration
  - Recall webhooks
  - Japan/APAC region currently used by this project: `ap-northeast-1`
  - Bot scheduling for planned meetings
  - ad-hoc Create Bot only for spontaneous/test meetings

## Speech-to-text

Primary final-transcript strategy:
- **AssemblyAI asynchronous transcription through Recall.ai**
- Configure the AssemblyAI API credential in the Recall dashboard in the same Recall region.
- Use Recall post-meeting transcription with the AssemblyAI async provider.
- Use speaker diarization / separate streams when available.

Optional after final pipeline works:
- real-time transcription during a meeting.

## LLM / meeting intelligence

- **Groq**
- Model: `openai/gpt-oss-120b`
- Use **Structured Outputs / JSON Schema** for deterministic backend contracts.
- Do not parse free-form prose with regex when structured output is available.

## Deployment

- **Vercel** — Next.js frontend
- **Railway** (preferred) or Render — FastAPI backend (single web process tonight; in-process
  `BackgroundTasks` handle async work)
- Separate backend worker process — **north-star only** (with Celery/Redis)
- Managed Redis on Railway/Upstash — **north-star only**
- Supabase hosted Postgres/Auth/Storage

---

# 4. IMPORTANT AUTHENTICATION DISTINCTION

There are two different OAuth concerns.

## A. NoteFlow application login

Use Supabase Auth + Google provider.

Purpose:
- identify the NoteFlow user,
- create session/JWT,
- authorize application data.

## B. Calendar connection

Calendar access is a separate integration and requires calendar permissions.

Use Recall Calendar V2 with the project's Google Calendar OAuth client configuration.

Do **not** assume “Sign in with Google” automatically gives NoteFlow Calendar permissions.

The onboarding UI must distinguish:

1. **Signed into NoteFlow**
2. **Calendar connected**

A user may be logged into NoteFlow while their calendar is disconnected.

---

# 5. HIGH-LEVEL PRODUCTION ARCHITECTURE

```text
                         ┌──────────────────────────────┐
                         │      Public NoteFlow Web     │
                         │   Next.js / Vercel           │
                         └──────────────┬───────────────┘
                                        │
                               Google sign in
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ Supabase Auth   │
                              └────────┬────────┘
                                       │ JWT
                                       ▼
┌──────────────────┐          ┌────────────────────┐
│ Recall Calendar  │◄────────►│ FastAPI Backend    │
│ + Meeting Bots   │          │ Railway/Render     │
└─────────┬────────┘          └───────┬────────────┘
          │                            │
          │ webhooks                   ├──────────────► PostgreSQL
          │                            │                (Supabase)
          ▼                            │
 real meeting capture                 ├──────────────► Storage
          │                            │                (Supabase)
          ▼                            │
  recording artifact                  ├──────────────► Redis Queue
          │                            │                     │
          ▼                            │                     ▼
 AssemblyAI transcript                │                Celery Worker
          │                            │                     │
          └────────────────────────────┘                     │
                                                           ▼
                                                       Groq LLM
                                                           │
                    summary/actions/highlights/citations ◄──┘
```

---

# 6. REAL MEETING LIFECYCLE

The database and UI must model a real lifecycle, not a single boolean.

Recommended meeting states:

```text
draft
scheduled
bot_scheduled
joining
in_waiting_room
recording
recording_complete
transcribing
generating_intelligence
ready
failed
cancelled
```

The exact list may be adapted to Recall's returned statuses, but persist a normalized internal status.

## Planned calendar meeting

```text
Google/Outlook calendar event
    ↓
Recall Calendar V2 sync event
    ↓
FastAPI fetches/updates event
    ↓
User/default says “record”
    ↓
Schedule Bot For Calendar Event
    ↓
Persist recall calendar_event_id + bot mapping
    ↓
Recall bot joins at meeting time
    ↓
recording events/webhooks
    ↓
recording.done
    ↓
enqueue final transcription
    ↓
AssemblyAI async transcript through Recall
    ↓
transcript.done
    ↓
normalize/store segments
    ↓
enqueue Groq intelligence
    ↓
persist summary/actions/highlights
    ↓
meeting.status = ready
```

## Impromptu/manual meeting

```text
User pastes meeting URL
    ↓
POST /meetings/capture
    ↓
validate URL + authenticated user
    ↓
Create Recall bot
    ↓
persist bot mapping
    ↓
same recording → transcription → AI pipeline
```

Use ad-hoc bots for spontaneous/testing flows, not as the primary production scheduling strategy.

---

# 7. DATABASE MODEL

Use UUID primary keys unless there is a strong repo-specific reason not to.

## profiles

- `id` UUID PK, FK → `auth.users.id`
- `display_name`
- `avatar_url`
- `timezone`
- `created_at`
- `updated_at`

## user_preferences

- `user_id`
- `default_capture_enabled`
- `default_auto_share_mode`
- `default_summary_template_id`
- `recording_notice_enabled`
- `created_at`
- `updated_at`

## calendar_connections

- `id`
- `user_id`
- `provider` (`google`, `microsoft`)
- `recall_calendar_id`
- `status`
- `provider_email`
- `connected_at`
- `disconnected_at`
- `created_at`
- `updated_at`

Do not store provider OAuth refresh tokens yourself if Recall owns that part of the integration.

## calendar_events

- `id`
- `user_id`
- `calendar_connection_id`
- `recall_event_id`
- `provider_event_id`
- `title`
- `meeting_url`
- `starts_at`
- `ends_at`
- `recording_enabled`
- `deduplication_key`
- `raw_metadata` JSONB (only if needed)
- timestamps

## meetings

- `id`
- `owner_user_id`
- `calendar_event_id` nullable
- `provider` (`google_meet`, `zoom`, `teams`, `unknown`)
- `meeting_url` (protect in API responses; do not unnecessarily expose publicly)
- `title`
- `status`
- `scheduled_at`
- `started_at`
- `ended_at`
- `duration_seconds`
- `recall_bot_id`
- `recall_recording_id`
- `recall_transcript_id`
- `processing_error_code`
- `processing_error_message`
- timestamps

## participants

- `id`
- `meeting_id`
- `external_participant_id` nullable
- `display_name`
- `email` nullable
- `is_host`
- `joined_at`
- `left_at`
- timestamps

## recordings

- `id`
- `meeting_id`
- `recall_recording_id`
- `storage_bucket`
- `storage_path`
- `mime_type`
- `duration_seconds`
- `size_bytes`
- `status`
- timestamps

## transcript_segments

- `id`
- `meeting_id`
- `participant_id` nullable
- `speaker_label`
- `start_ms`
- `end_ms`
- `text`
- `sequence`
- `search_vector` if implemented/generated
- timestamps

Indexes:
- `(meeting_id, sequence)`
- `(meeting_id, start_ms)`
- full-text index for transcript search

## summary_templates

Product configuration, not fake meeting data.

- `id`
- `key`
- `name`
- `description`
- `system_instructions`
- `output_schema_version`
- `is_builtin`
- `is_active`
- timestamps

Built-in templates may be inserted by migration:
- General
- Project Kick-Off
- Project Update
- One-on-One
- Q&A
- Customer Success
- Candidate Interview
- Retrospective

Do not copy Fathom's proprietary prompts.

## meeting_summaries

- `id`
- `meeting_id`
- `template_id`
- `content_json` JSONB
- `rendered_markdown` optional
- `model`
- `generation_version`
- timestamps

Unique:
- `(meeting_id, template_id, generation_version)` as appropriate

## action_items

- `id`
- `meeting_id`
- `assignee_participant_id` nullable
- `assignee_text` nullable
- `text`
- `due_at` nullable
- `status`
- `source_segment_ids` UUID[] or join table
- `created_by` (`ai`, `user`)
- timestamps

## highlights

- `id`
- `meeting_id`
- `created_by_user_id`
- `title`
- `type`
- `start_ms`
- `end_ms`
- `source_segment_id` nullable
- `created_by` (`ai`, `user`)
- timestamps

## meeting_shares

- `id`
- `meeting_id`
- `created_by_user_id`
- `token_hash`
- `access_mode`:
  - `anyone_with_link`
  - `domain`
  - `specific_people`
- `allowed_domain` nullable
- `expires_at` nullable
- `revoked_at` nullable
- timestamps

Never store the raw share token if hashing is practical.

## share_recipients

- `id`
- `meeting_share_id`
- `email`
- timestamps

## ask_threads

- `id`
- `meeting_id` nullable for future account-wide Ask
- `user_id`
- timestamps

## ask_messages

- `id`
- `thread_id`
- `role`
- `content`
- `citations_json`
- `model`
- timestamps

## webhook_events

Used for idempotency/debugging.

- `id`
- `provider`
- `external_event_id`
- `event_type`
- `payload_hash`
- `processed_at`
- `status`
- `error`
- timestamps

Unique:
- `(provider, external_event_id)` when provider supplies a stable ID

---

# 8. ROW-LEVEL SECURITY / AUTHORIZATION

Enable RLS for all user-facing tables.

Core rule:
- authenticated users can only read/write data they own or are explicitly authorized to access.

Examples:
- `profiles.id = auth.uid()`
- meeting owner can read/write meeting
- public share access must go through a controlled backend/share-token path, not broad anonymous database access
- service-role key is backend-only
- frontend receives only anon/publishable Supabase credentials

FastAPI must independently verify the Supabase JWT for protected backend routes.

Do not trust a `user_id` provided in the request body.

---

# 9. RECALL.AI INTEGRATION

## Region

Current workspace region:
- `ap-northeast-1`

Never hardcode a different region into API calls.

Environment variable:

```text
RECALL_REGION=ap-northeast-1
```

## Required Recall setup

Human-owned dashboard setup:
- API key
- workspace verification secret
- webhook URL
- AssemblyAI transcription credential configured in the **same Recall region**
- Google Calendar OAuth client for Calendar V2
- later Microsoft OAuth client if Outlook is added

## Recall secrets

Backend only:

```text
RECALL_API_KEY=
RECALL_WORKSPACE_VERIFICATION_SECRET=
RECALL_REGION=ap-northeast-1
```

## Webhooks

Create one verified webhook endpoint, e.g.:

```text
POST /webhooks/recall
```

Responsibilities:
1. read raw request body,
2. verify signature with Recall workspace verification secret,
3. reject invalid signatures,
4. deduplicate event,
5. persist event metadata,
6. update normalized meeting/bot state,
7. enqueue long-running work rather than blocking webhook response,
8. respond quickly.

At minimum support artifact/lifecycle events required by the chosen Recall flow:
- calendar updates/sync events,
- recording completion/failure,
- transcript completion/failure,
- bot lifecycle events needed for status UI.

Do not implement status polling as the primary lifecycle mechanism when a webhook exists.

## Bot configuration

Use a clear bot identity, e.g.:
- `NoteFlow Notetaker`

Where platform support exists, send a recording/consent notice in meeting chat.

Production scheduled bots:
- schedule as soon as calendar data provides meeting URL/start time,
- use `join_at`,
- prefer more than 10 minutes advance scheduling,
- use Recall Calendar V2 deduplication keys for shared events.

Manual/spontaneous:
- allow ad-hoc Create Bot from a meeting URL,
- surface failures clearly.

---

# 10. TRANSCRIPTION STRATEGY

## Submission baseline — final post-meeting transcript

After `recording.done`:

1. enqueue `create_final_transcript(meeting_id)`
2. call Recall Create Async Transcript for the recording
3. provider:
   - AssemblyAI async
4. enable separate-stream/diarization behavior when supported
5. persist Recall transcript ID
6. wait for verified `transcript.done`
7. fetch transcript artifact
8. normalize into `transcript_segments`
9. map speakers to Recall participant metadata where possible
10. mark meeting `generating_intelligence`
11. enqueue Groq processing

This is the canonical transcript used by:
- meeting workspace,
- summaries,
- action items,
- Ask NoteFlow,
- search,
- highlights.

## Optional real-time enhancement

Only after the final pipeline is stable:
- configure Recall real-time transcription,
- consume finalized utterance events,
- store/update live transcript segments,
- show live transcript/live summary UI,
- replace/merge with canonical async transcript after meeting.

Do not delay the working post-meeting product for live transcription.

---

# 11. GROQ MEETING INTELLIGENCE

## Model

```text
openai/gpt-oss-120b
```

Use Groq Structured Outputs with strict JSON schema when supported.

## Never ask for one giant unstructured blob

Create explicit Pydantic schemas.

### MeetingIntelligence schema

Conceptually:

```json
{
  "overview": "...",
  "key_points": [],
  "decisions": [
    {
      "text": "...",
      "segment_ids": []
    }
  ],
  "action_items": [
    {
      "text": "...",
      "assignee": "...",
      "due_text": null,
      "segment_ids": []
    }
  ],
  "risks": [],
  "suggested_highlights": [
    {
      "title": "...",
      "start_segment_id": "...",
      "end_segment_id": "..."
    }
  ],
  "suggested_questions": []
}
```

The exact schema should be implemented with Pydantic and JSON Schema.

## Evidence/citations are mandatory

Before sending transcript to Groq, serialize segments with stable source IDs:

```text
[SEGMENT 0182 | 00:18:42.100 - 00:18:48.500 | Ammar]
We'll use Vercel for the release.
```

Groq outputs segment IDs as evidence.

Validate:
- every returned citation exists,
- every action/highlight timestamp can be resolved from cited segments,
- invalid citations are discarded or regeneration is requested.

This makes AI output traceable to the actual meeting.

## Summary templates

Changing the summary template should perform a real backend generation for that transcript and save the result.

Do not regenerate on every page view.

Cache/persist generated summaries per meeting/template.

---

# 12. ASK NOTEFLOW — REAL AI, REAL CITATIONS

Endpoint:

```text
POST /api/meetings/{meeting_id}/ask
```

Input:
- question
- optional thread ID

Backend:
1. authorize user,
2. load meeting,
3. retrieve relevant transcript context,
4. call Groq,
5. require structured answer:
   - answer markdown/text,
   - citation segment IDs,
   - optional follow-up questions,
6. validate citations,
7. persist Ask thread/message,
8. return answer with resolved timestamps.

Frontend response example:

```text
The team decided to deploy using Vercel.

Related moment
▶ Deployment decision · 18:42
```

Clicking citation:
- calls shared `seekTo(seconds)` playback controller,
- selects/scrolls transcript segment.

## Retrieval strategy

Single meeting:
- for short/normal meetings, full transcript may fit the model context;
- for long transcripts, use PostgreSQL full-text retrieval to select relevant segments before Groq.

Account-wide Ask (later phase):
- search owned meetings/transcripts/summaries/action items,
- retrieve top evidence,
- Groq synthesizes response with meeting + segment citations.

No hardcoded answers.

---

# 13. SEARCH

## In-meeting transcript search

Backend or client over real stored transcript data:
- exact/substring highlighting for immediate transcript UX,
- result timestamp,
- click result → shared seek mechanism.

## Cross-meeting search

Use PostgreSQL full-text search.

Search fields:
- meeting title
- participant names
- transcript text
- summaries
- action items

Result example:

```text
Product Design Review
18:42 — “We'll use Vercel for the release.”
```

Click:
- navigate `/app/meetings/{id}?t=1122`
- meeting page reads timestamp,
- player seeks,
- transcript scrolls/selects.

Do not implement fake “AI search” until real search is correct.

---

# 14. MEDIA / STORAGE

Recall owns the initial recording artifact.

After recording completion:
1. obtain/download the recording from Recall when ready,
2. copy it to private Supabase Storage,
3. persist storage object path and metadata,
4. serve authenticated users through short-lived signed URLs.

Public shares:
- validate share token,
- generate a short-lived media URL specifically for the authorized share request.

Do not make the recordings bucket public.

Do not expose permanent Recall artifact URLs to clients if a durable app-owned copy is available.

---

# 15. PLAYBACK + TRANSCRIPT SYNCHRONIZATION

This remains a core UX requirement.

Create a shared playback controller/context/hook.

Required API conceptually:

```text
currentTime
duration
isPlaying
play()
pause()
seekTo(seconds)
skipBy(seconds)
setPlaybackRate(rate)
```

Acceptance criteria:
- active transcript segment satisfies `start <= currentTime < end`
- active segment visibly highlights
- transcript auto-scrolls when needed
- clicking transcript seeks to segment start
- Ask citations use the same seek mechanism
- search results use the same seek mechanism
- highlights use the same seek mechanism
- URL `?t=` timestamp uses the same mechanism
- ±10-second controls work
- playback speed control works

Do not implement separate seeking logic in five different components.

---

# 16. ACTION ITEMS

Action items come from real Groq output and are persisted.

Features:
- text
- assignee
- due date/text if confidently extracted
- evidence links
- complete/uncomplete state
- user can edit AI output
- user can manually add an action item
- “View source” seeks to transcript evidence

Do not treat an inferred task as factual if the evidence is weak; preserve source evidence.

---

# 17. HIGHLIGHTS / MOMENTS

Support:

## Manual
- user selects/marks a transcript moment/range,
- title/type,
- start/end timestamps,
- persist.

## AI-suggested
- Groq returns candidates backed by segment IDs,
- user can accept/delete/edit.

Highlight playback:
- click highlight → seek start
- optionally stop/visualize end boundary

Sharing:
- a shared highlight may use the same share system plus start/end query parameters or a dedicated highlight token.

---

# 18. SHARING

Meeting owner can create share access.

Minimum submission:
- `anyone_with_link`
- revoke share
- read-only public meeting page

If time permits:
- same-domain
- specific-email recipients
- expiry

Public share page may show:
- recording
- summary
- transcript
- action items
- highlights

Public share page must not expose:
- owner settings,
- calendar URLs,
- internal integration IDs,
- other private meetings,
- edit/delete controls.

---

# 19. PUBLIC MARKETING + AUTH UX

The user explicitly wants the product to feel complete before entering the app.

## Public pages

### `/`
Polished NoteFlow marketing homepage:
- hero
- concise value proposition
- product screenshot/mockup built from the actual app UI
- core feature sections
- “How it works”
- supported platforms (only claim what is actually implemented)
- privacy/consent positioning
- CTA: “Get started with Google”
- secondary CTA: “Sign in”

Do not spend hours duplicating Fathom's entire marketing website.

### `/login`
- Continue with Google

### `/signup`
- Continue with Google
- short consent/privacy language

Optional if time:
- `/privacy`
- `/terms`

Do not build fake pricing/billing unless billing is actually implemented.

---

# 20. ONBOARDING

After first login:

## Step 1 — Welcome
- name/avatar from Google
- timezone confirmation

## Step 2 — Connect calendar
- Google Calendar
- Microsoft Outlook can be “coming later” unless actually configured
- show real connection state

## Step 3 — Capture preferences
- default “record supported meetings” toggle
- recording notice enabled
- auto-share default

## Step 4 — Ready
- show upcoming real calendar meetings
- allow user to enable/disable NoteFlow per event
- manual “Record an impromptu meeting” action

Never fake a connected calendar state.

---

# 21. APP ROUTES / FRONTEND INFORMATION ARCHITECTURE

Recommended:

```text
/
├── /login
├── /signup
├── /share/[token]                  public
└── /app                            authenticated
    ├── /meetings                   My Meetings
    ├── /meetings/[id]              Meeting Workspace
    ├── /upcoming                   Calendar/upcoming meetings
    ├── /search                     Cross-meeting search
    ├── /settings
    │   ├── /profile
    │   ├── /calendar
    │   ├── /capture
    │   └── /sharing
    └── /onboarding
```

The exact routing can adapt to the existing repo, but keep public and authenticated surfaces clear.

---

# 22. FASTAPI API SURFACE

Use `/api/v1`.

## System

```text
GET  /api/v1/health
```

## User/profile

```text
GET   /api/v1/me
PATCH /api/v1/me
GET   /api/v1/preferences
PATCH /api/v1/preferences
```

## Calendar

```text
POST   /api/v1/calendar/connect
GET    /api/v1/calendar/connections
DELETE /api/v1/calendar/connections/{id}
GET    /api/v1/calendar/events
PATCH  /api/v1/calendar/events/{id}/capture
```

Exact Recall OAuth/connect handshake must follow Recall Calendar V2 docs rather than invented request shapes.

## Meetings

```text
GET    /api/v1/meetings
GET    /api/v1/meetings/{id}
POST   /api/v1/meetings/capture          # manual URL / impromptu
POST   /api/v1/meetings/{id}/cancel      # when valid
DELETE /api/v1/meetings/{id}
```

## Summary

```text
GET  /api/v1/meetings/{id}/summaries
POST /api/v1/meetings/{id}/summaries
```

## Action items

```text
GET    /api/v1/meetings/{id}/action-items
POST   /api/v1/meetings/{id}/action-items
PATCH  /api/v1/action-items/{id}
DELETE /api/v1/action-items/{id}
```

## Ask

```text
POST /api/v1/meetings/{id}/ask
GET  /api/v1/meetings/{id}/ask/threads
```

## Highlights

```text
GET    /api/v1/meetings/{id}/highlights
POST   /api/v1/meetings/{id}/highlights
PATCH  /api/v1/highlights/{id}
DELETE /api/v1/highlights/{id}
```

## Search

```text
GET /api/v1/search?q=
```

## Sharing

```text
POST   /api/v1/meetings/{id}/shares
GET    /api/v1/meetings/{id}/shares
DELETE /api/v1/shares/{id}
GET    /api/v1/public/shares/{token}
```

## Webhooks

```text
POST /webhooks/recall
```

Keep webhook route outside normal user JWT auth; secure it with Recall signature verification.

---

# 23. BACKGROUND JOBS

Long-running work must not block API requests/webhook acknowledgments.

> **Tonight:** these run as FastAPI `BackgroundTasks` scheduled from the webhook/API handlers, with
> a `jobs` table (`meeting_id, type, status, attempts, error, timestamps`) for status/observability.
> The task *names/contract* below are unchanged; only the executor differs from the Celery north-star.

Queue tasks:

```text
process_recording(meeting_id)
create_final_transcript(meeting_id)
normalize_transcript(meeting_id)
generate_meeting_intelligence(meeting_id)
generate_summary(meeting_id, template_id)
copy_recording_to_storage(meeting_id)
```

Requirements:
- idempotent,
- retries with bounded exponential backoff,
- safe to run twice,
- persist processing errors,
- move meeting to `failed` only when failure is terminal,
- expose actionable error state to owner.

---

# 24. ERROR HANDLING

The UI must show truthful statuses.

Examples:
- bot waiting for admission
- bot rejected from meeting
- unsupported meeting URL
- meeting ended before bot joined
- Recall service/API error
- recording failed
- transcription failed
- Groq generation failed
- calendar disconnected
- OAuth expired/revoked
- share revoked
- recording still processing

Provide retry actions only when they are meaningful.

Never turn an API failure into a fake successful meeting.

---

# 25. SECURITY / PRIVACY / RECORDING CONSENT

Recording people is sensitive.

Required:
- user agrees they are responsible for obtaining required recording consent,
- show recording/capture status clearly,
- bot has visible NoteFlow identity,
- use recording notice/chat when supported,
- avoid hidden recording behavior,
- private recordings bucket,
- short-lived signed media URLs,
- RLS and backend auth,
- webhook signature verification,
- strict CORS origins,
- rate-limit bot creation and Ask endpoints,
- redact secrets from logs,
- do not log raw auth tokens,
- never store API keys in DB unless intentionally encrypted and required.

The assignment repo is public; secrets must never be committed.

---

# 26. ENVIRONMENT VARIABLES

## Frontend

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=
```

Only public values.

## Backend

```text
ENVIRONMENT=
FRONTEND_URL=

DATABASE_URL=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_AUDIENCE=

RECALL_API_KEY=
RECALL_WORKSPACE_VERIFICATION_SECRET=
RECALL_REGION=ap-northeast-1

GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b

REDIS_URL=

# AssemblyAI key is needed by NoteFlow only if NoteFlow calls AssemblyAI
# directly. If Recall owns the AssemblyAI integration, configure the key
# in the Recall dashboard and do not duplicate it unnecessarily.
ASSEMBLYAI_API_KEY=
```

Never commit `.env`.

Maintain:
- `frontend/.env.example`
- `backend/.env.example`

---

# 27. PROJECT STRUCTURE

Adapt to existing repo rather than destroying it.

> **Tonight (canonical):** keep the existing Next.js app **at the repo root** exactly as-is
> (`src/`, `package.json`, `tailwind.config.ts` at root) and add a sibling **`backend/`** only.
> Do **not** move the frontend under `frontend/`. The layout below is the **north-star** target.

Recommended target (north-star):

```text
noteflow/
├── .agent-logs/
├── .claude/
├── docs/
│   ├── research/fathom/
│   ├── planning/
│   │   └── PLAN.md
│   └── architecture/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── types/
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── recall.py
│   │   │   ├── groq.py
│   │   │   ├── transcription.py
│   │   │   ├── storage.py
│   │   │   └── search.py
│   │   ├── workers/
│   │   └── webhooks/
│   ├── alembic/
│   ├── tests/
│   ├── .env.example
│   └── pyproject.toml
│
├── docker-compose.yml
├── README.md
└── PLAN.md
```

If the existing Next.js app is already at repo root, do not reorganize it merely for aesthetic reasons. Prefer minimum-risk evolution.

---

# 28. DEVELOPMENT PHASES

> **Tonight reachability (see TONIGHT SCOPE):**
> - 🟢 **Phase 0** — baseline audit: DONE (repo mapped; see §3-equivalent audit in this file's history).
> - 🟢/🟡 **Phase 1** — foundation (FastAPI + SQLAlchemy + Alembic + Supabase JWT + `/health` + `jobs`
>   table + `.env.example`). Building now, minus Celery/Redis/Docker-worker.
> - 🟡 **Phase 2** — marketing-lite + real Google auth + protected `/app`.
> - 🔵 **Phase 3** — real manual Recall capture (first GO/NO-GO; likely spills past the deadline).
> - 🔵 **Phases 4–5** — recording→transcript→Groq for the one captured meeting (target if setup is fast).
> - 🔵 **Phase 6** — swap the existing workspace's data source to the API for that meeting.
> - 🔵 **Phases 7–15** — NORTH-STAR, not tonight (playback already built; Ask/search/templates/
>   highlights/calendar/storage/hardening/real-time/desktop deferred).
>
> Where a phase below prescribes Celery/Redis/Docker-worker or the `frontend/` move, the TONIGHT
> SCOPE overrides it.

## Phase 0 — Baseline audit (first task)

Claude must:
- inspect current repo,
- run existing frontend,
- identify current static/hardcoded meeting data,
- identify UI that can be preserved,
- map current types/components to this plan,
- inspect `.agent-logs/` health,
- inspect git status,
- do not delete working work.

Deliver:
- baseline report,
- migration strategy from static prototype to real full-stack architecture.

---

## Phase 1 — Full-stack foundation

Build:
- FastAPI backend
- SQLAlchemy
- Alembic
- Supabase project wiring
- backend JWT verification
- profiles/preferences tables
- CORS
- health endpoint
- `.env.example`
- Docker Compose for backend + Redis locally
- worker skeleton

Acceptance:
- frontend builds,
- backend starts,
- `/health` works,
- authenticated request can resolve current Supabase user,
- migrations apply cleanly,
- no secrets committed.

---

## Phase 2 — Marketing + real auth

Build:
- polished NoteFlow homepage
- login/signup
- Supabase Google OAuth
- auth callback/session handling
- protected `/app`
- profile creation on first login
- onboarding shell

Acceptance:
- fresh user can use Google sign-in,
- unauthenticated user cannot access protected app,
- session survives refresh,
- logout works,
- live deployment callback URLs work.

---

## Phase 3 — Recall manual vertical slice FIRST

Before Calendar automation, prove a real capture pipeline.

Build:
- Recall service wrapper
- manual “Record meeting” modal
- validate Meet/Zoom/Teams URL
- `POST /meetings/capture`
- create Recall bot
- persist real bot/meeting IDs
- verified Recall webhook endpoint
- bot status UI

Acceptance:
1. user pastes a real Google Meet URL,
2. NoteFlow bot actually appears,
3. database reflects real bot lifecycle,
4. user can see status in NoteFlow,
5. no fake fallback exists.

This is the first major go/no-go milestone.

---

## Phase 4 — Recording → transcript

Build:
- process `recording.done`
- create AssemblyAI async transcript through Recall
- handle `transcript.done` / `transcript.failed`
- normalize real transcript segments
- persist participants/speakers/timestamps
- meeting processing UI

Acceptance:
- speak in a real 2–5 minute meeting,
- end call,
- real transcript appears in NoteFlow,
- timestamps align with real recording,
- multiple speakers are represented when test call has multiple speakers.

---

## Phase 5 — Groq intelligence

Build:
- Pydantic intelligence schemas
- Groq structured output
- summary
- key points
- decisions
- action items + citations
- highlight suggestions + citations
- suggested questions
- validation layer
- persisted results

Acceptance:
- no hardcoded AI response,
- every citation references a stored transcript segment,
- meeting becomes `ready` only after successful required processing,
- failed AI job is visible/retryable.

---

## Phase 6 — Core Fathom-style meeting workspace

Build/refactor existing UI to use backend data only:
- Summary
- Action Items
- Transcript
- recording player
- Ask panel shell
- 10s back/forward
- playback speed
- copy transcript/summary where useful
- loading/processing/failure states

Delete or isolate old hardcoded production meeting data once real API path replaces it.

Acceptance:
- meeting page works after browser refresh,
- data comes from API/database,
- no production component imports fake meeting arrays.

---

## Phase 7 — Playback ↔ transcript sync

Build one shared playback controller.

Acceptance:
- playback highlights current transcript segment,
- transcript auto-scroll,
- transcript click seeks,
- URL `?t=` seeks,
- Ask/search/highlights later reuse the same controller.

---

## Phase 8 — Real Ask NoteFlow + search

Build:
- meeting-level Ask endpoint
- citation validation
- Ask threads/messages
- timestamp citation UI
- transcript search
- PostgreSQL cross-meeting search

Acceptance:
- user asks a new question not pre-authored by developer,
- answer is generated at request time,
- citations seek to real meeting moments,
- searching a phrase from a real meeting finds it.

---

## Phase 9 — Summary templates + action management

Build:
- summary-template DB/config
- real regeneration through Groq
- cached summaries
- action item complete/edit/add/delete
- source evidence navigation

Acceptance:
- switching template results in a genuinely regenerated template-specific summary,
- reload retains generated summary,
- action edits persist.

---

## Phase 10 — Highlights + sharing

Build:
- manual transcript highlight creation
- AI suggestion acceptance
- share dialog
- anyone-with-link token
- revoke share
- public read-only page
- signed recording URL

Acceptance:
- highlight persists,
- highlight click seeks,
- public share works in incognito,
- revoking share makes it inaccessible,
- public page exposes no private meeting data beyond the shared meeting.

---

## Phase 11 — Calendar V2 automation

Now automate the capture lifecycle.

Build:
- connect Google Calendar through Recall Calendar V2
- store connection
- receive calendar webhooks
- list upcoming events
- recording toggle per event
- default capture preference
- schedule bots for enabled events
- deduplicate shared events
- reschedule when event changes
- clean handling of deleted/disconnected calendars

Acceptance:
- create a real Google Calendar event with a Meet URL,
- it appears in NoteFlow,
- turn capture on,
- Recall bot is scheduled,
- change event time and bot schedule updates,
- at meeting time bot joins automatically.

This completes the “Fathom-like automatic notetaker” core.

---

## Phase 12 — Durable media ownership

Build:
- copy completed Recall recording to private Supabase Storage
- recordings table
- signed URL endpoint/logic
- retention/error handling

Acceptance:
- playback uses NoteFlow-owned stored artifact,
- bucket is private,
- owner can play,
- public share receives temporary authorized media URL.

---

## Phase 13 — Production hardening

Build/fix:
- idempotent webhooks
- idempotent workers
- retries/backoff
- request validation
- rate limiting
- DB constraints/indexes
- RLS audit
- CORS
- error boundaries
- observability/logging
- delete/cancel behaviors
- privacy/consent messaging
- timezone correctness

Run:
- frontend lint
- frontend typecheck
- frontend production build
- backend tests
- migration test from clean DB
- integration smoke tests

---

## Phase 14 — Optional real-time layer

Only after all above is stable.

Possible:
- Recall real-time transcription
- live transcript
- live summary refresh
- in-meeting status panel

Do not risk the post-meeting pipeline for this.

---

## Phase 15 — Optional desktop/bot-free capture

Post-submission or only with large remaining time:
- Electron app
- Recall Desktop Recording SDK
- system permissions
- bot-free local capture
- sync artifacts back to NoteFlow backend

This is the path toward modern Fathom-style bot-free capture, but it is not required for the first professional full-stack submission.

---

# 29. TEST STRATEGY

## Unit tests

Backend:
- JWT auth dependency
- Recall payload normalization
- webhook signature verification
- webhook idempotency
- meeting status transitions
- transcript normalization
- Groq schema validation
- citation validation
- share-token verification

Frontend:
- playback time formatter
- transcript active-segment calculation
- search rendering
- access guards where practical

## Integration tests

- Supabase DB/repository layer
- Recall wrapper with mocked HTTP for deterministic tests
- Groq service mocked at transport boundary
- webhook fixture replay

## Real external smoke tests

At least one real production-like test:
- Google login
- Google Meet
- real Recall bot
- recording
- real AssemblyAI transcript
- real Groq summary/action items
- playback + synced transcript
- Ask
- share in incognito

Before submission, run this from the deployed environment, not only localhost.

---

# 30. SUBMISSION DEMO SCRIPT

The walkthrough must be ≤5 minutes and camera on.

Suggested flow:

### 0:00–0:25
Explain NoteFlow and scope:
- Fathom-inspired real meeting-intelligence product
- bot capture handled via Recall rather than rebuilding conferencing infrastructure from scratch

### 0:25–0:50
Landing page → Google login → app dashboard/upcoming meeting.

### 0:50–1:20
Show real calendar/meeting capture configuration or a meeting previously captured through the live pipeline.

### 1:20–2:20
Open real meeting:
- play recording,
- transcript follows,
- click transcript to seek.

### 2:20–2:50
Summary + action items + source citation.

### 2:50–3:35
Ask a new question live.
- show generated answer,
- click timestamp citation,
- jump to recording.

### 3:35–4:05
Search across meeting(s) and jump to result.

### 4:05–4:30
Create/view highlight + share.

### 4:30–4:50
Open public share in incognito.

### 4:50–5:00
Mention architectural choice:
- real APIs,
- verified webhooks,
- Supabase persistence,
- Recall + AssemblyAI + Groq,
- `.agent-logs/` committed.

---

# 31. FINAL SUBMISSION CHECKLIST

## Assignment requirements

- [ ] public repository
- [ ] `.agent-logs/` committed incrementally
- [ ] live deployed link
- [ ] live link works for reviewer
- [ ] walkthrough ≤5 minutes
- [ ] camera on
- [ ] live link and repo clearly labeled in submission

## Real-product proof

- [ ] Google login works
- [ ] no production UI depends on fake meeting arrays
- [ ] real Recall bot successfully joins supported meeting
- [ ] real recording exists
- [ ] real transcript is stored
- [ ] real Groq summary/actions are persisted
- [ ] transcript synchronization works
- [ ] Ask NoteFlow generates a new real answer
- [ ] citations seek to actual transcript moments
- [ ] share page works in incognito
- [ ] secrets absent from Git history
- [ ] RLS/security checked

## Calendar automation proof

If completed:
- [ ] real calendar connected
- [ ] real event visible
- [ ] bot scheduled automatically
- [ ] rescheduling handled

---

# 32. PRIORITY ORDER IF TIME BECOMES CRITICAL

Do not revert to fake meeting data.

Cut optional breadth, not authenticity.

Priority:

1. Real Google auth
2. Real manual Recall bot capture
3. Real recording
4. Real final transcript
5. Real Groq summary/actions
6. Real meeting workspace
7. Playback/transcript sync
8. Real Ask NoteFlow
9. Share
10. Calendar automation
11. Cross-meeting search
12. Summary templates
13. Highlights
14. Marketing-page extras
15. Real-time transcription
16. Desktop capture

If time becomes critical, it is better to submit a smaller **real** end-to-end product than a wider fake product.

---

# 33. FIRST CLAUDE TASK AFTER ADDING THIS PLAN

Do not immediately code everything.

Claude's next task is:

> **Phase 0 — Baseline Audit.**
>
> Read `PLAN.md`, inspect the full repository, run the existing application, identify every current static/hardcoded meeting-data path, map the existing frontend components to the target architecture, inspect current dependencies/configuration, and produce a concrete migration report. Do not delete or rewrite working UI yet. Report:
>
> 1. current repository structure,
> 2. what is already working,
> 3. where fake/static meeting data currently enters the application,
> 4. what can be reused,
> 5. exact Phase 1 files/dependencies/migrations needed,
> 6. risks/blockers,
> 7. human setup steps required before Claude can complete Recall/Supabase/Google integrations.
>
> Stop after the audit for approval.

After approval, execute Phase 1 only.

---

# 34. HUMAN-OWNED SETUP CHECKLIST

Claude must not fabricate success for these.

## Supabase
- [ ] project created
- [ ] Google Auth provider configured
- [ ] production/dev redirect URLs configured
- [ ] database credentials available locally
- [ ] Storage configured later by migration/setup
- [ ] service-role secret backend-only

## Google Cloud
- [ ] OAuth consent/app configured for NoteFlow login
- [ ] Supabase Google callback configured
- [ ] separate Calendar OAuth client/scopes configured as required by Recall Calendar V2

## Recall.ai
- [ ] workspace region confirmed: `ap-northeast-1`
- [ ] API key created
- [ ] workspace verification secret created
- [ ] webhook endpoint configured once backend has a public URL
- [ ] AssemblyAI API credential added to Recall transcription settings in same region
- [ ] Calendar V2 Google OAuth client configured

## Groq
- [ ] API key created
- [ ] key backend-only

## AssemblyAI
- [ ] API key created
- [ ] configured in Recall dashboard if Recall invokes AssemblyAI
- [ ] direct backend key only if NoteFlow will call AssemblyAI directly

## Deployment
- [ ] Vercel project
- [ ] Railway/Render backend
- [ ] Redis
- [ ] environment variables
- [ ] webhook public URL
- [ ] production OAuth redirect URLs

---

# 35. DEFINITION OF DONE

The project is not “done” because pages look like Fathom.

It is done for this assignment when a reviewer can observe a **real data lifecycle**:

```text
real user
    ↓
real authenticated NoteFlow account
    ↓
real supported meeting
    ↓
real Recall capture
    ↓
real recording
    ↓
real AssemblyAI transcript
    ↓
real Groq intelligence
    ↓
real PostgreSQL persistence
    ↓
real synchronized playback/transcript
    ↓
real Ask NoteFlow answer with evidence
    ↓
real share link
```

The UI should be polished and Fathom-inspired, but the engineering proof is that this chain actually works.
