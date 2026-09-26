# NoteFlow

**Real-time meeting intelligence — capture, transcribe, and understand your conversations.**

NoteFlow sends a notetaker bot into your Google Meet, Zoom, or Microsoft Teams calls, then turns
each meeting into a searchable transcript with real speaker names, an AI summary, action items,
key moments, and answers you can ask across every conversation you've had — each one cited back to
the exact moment it was said.

It is a full-stack, Fathom-inspired product built on a **real** pipeline end to end: real Google
authentication, real bot capture, real recording → transcription, real AI generation, real
persistence, and real public sharing. Nothing on the authenticated path is seeded or faked.

---

## Features

- **One-click capture** — paste a meeting link (Meet / Zoom / Teams) and a NoteFlow bot joins and
  records. Truthful live status: `joining → recording → transcribing → ready`.
- **Diarized transcript** — per-participant streams produce real speaker labels, timestamped and
  synced to the recording via a shared `seekTo` primitive. Full in-meeting transcript search.
- **Meeting intelligence** — a structured AI summary, decisions, action items, and key moments,
  generated from the real transcript with every claim citation-validated to a real segment id.
- **Ask across your meetings** — ask a question and get an answer grounded in your own
  conversations, with citations that jump to the source moment.
- **Action items & highlights** — commitments and key moments surfaced across all meetings, each
  linked back to where it came from.
- **Sharing** — publish a read-only recap to a public link; copy or revoke at any time.
- **People** — a conservative cross-meeting identity layer: participants resolved to people by
  trustworthy evidence (never by name-guessing), with a conversation history per person.
- **Account settings** — edit your display name, view your account, sign out.

---

## Architecture

```
                    ┌──────────────────────────────┐
  Browser ────────▶ │  Next.js (App Router) — Vercel │
                    │  • Supabase Google auth        │
                    │  • authenticated /app dashboard│
                    └───────────────┬────────────────┘
                                    │  JWT (Supabase)
                                    ▼
                    ┌──────────────────────────────┐        ┌──────────────┐
                    │  FastAPI backend — Railway     │◀──────▶│  Supabase     │
                    │  • verifies Supabase JWT       │        │  Postgres+Auth│
                    │  • capture / transcript / AI   │        │  + Realtime   │
                    │  • BackgroundTasks + jobs table│        └──────────────┘
                    └───────┬───────────────┬────────┘
                            │               │
                   webhooks │               │ API calls
                            ▼               ▼
                    ┌──────────────┐   ┌──────────────┐
                    │  Recall.ai    │   │  Groq (LLM)   │
                    │  bot capture  │   │  intelligence │
                    │  + AssemblyAI │   │  + Ask        │
                    │  transcription│   └──────────────┘
                    └──────────────┘
```

Long-running work (create-transcript, process-transcript, intelligence) runs via FastAPI
`BackgroundTasks` with a database `jobs` table for idempotency and observability. Recall delivers
lifecycle events to a signed webhook; a reconciliation sweeper heals anything a dropped webhook
would otherwise leave stuck. Realtime meeting-status updates reach the UI over Supabase Realtime.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) · TypeScript · Tailwind CSS |
| Backend | FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2 |
| Database & Auth | Supabase (Postgres, Google OAuth, Realtime) |
| Capture & transcription | Recall.ai (bot capture) · AssemblyAI (diarized transcript, via Recall) |
| Intelligence | Groq (LLM summary, action items, key moments, Ask) |
| Hosting | Vercel (frontend) · Railway (backend) |

---

## Repository layout

```
.
├── src/                  # Next.js frontend (App Router)
│   ├── app/              # routes — marketing, auth, and the authenticated /app dashboard
│   ├── components/       # UI (dashboard islands under components/app)
│   └── lib/              # API client, formatting, auth/profile helpers
├── backend/              # FastAPI service
│   ├── app/              # routes (api.py), models, schemas, services, webhooks, security
│   ├── alembic/          # database migrations
│   ├── tests/            # pytest suite
│   └── Dockerfile        # container image used by Railway
├── extension/            # Chrome extension (one-click capture)
└── docs/                 # planning & design notes
```

---

## Getting started (local)

**Prerequisites:** Node.js 20+, Python 3.12, and Supabase / Recall.ai / Groq accounts.

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env         # fill in the values (see below)
alembic upgrade head         # apply migrations (uses DIRECT_URL)
uvicorn app.main:app --port 8000
```

Health check: `curl http://localhost:8000/api/v1/health`

### 2. Frontend (Next.js)

```bash
# from the repo root
cp .env.example .env.local    # set the three NEXT_PUBLIC_ values
npm install
npm run dev                   # http://localhost:3000
```

Sign in with Google, then use **Capture** to send a bot into a real meeting.
> Recall webhooks can't reach `localhost` — status updates need the deployed backend or a tunnel
> (e.g. cloudflared / ngrok → `/webhooks/recall`). Capture itself still works locally.

---

## Environment variables

**Frontend (`.env.local`)** — public values only:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL (`http://localhost:8000` in dev, Railway URL in prod) |

**Backend (`backend/.env`)** — secrets, never committed:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler (port 6543) — runtime |
| `DIRECT_URL` | Supabase session pooler (port 5432) — migrations |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project + keys |
| `SUPABASE_JWT_SECRET` / `SUPABASE_JWT_AUDIENCE` | Backend JWT verification |
| `RECALL_API_KEY` / `RECALL_REGION` / `RECALL_WORKSPACE_VERIFICATION_SECRET` | Recall.ai capture + webhook signing |
| `GROQ_API_KEY` / `GROQ_MODEL` | Intelligence + Ask |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated |

Google OAuth login is configured in the **Supabase dashboard** (Auth → Providers → Google); the
backend only verifies the resulting Supabase JWT and never sees Google credentials.

---

## Testing

```bash
cd backend && source .venv/bin/activate
python -m pytest -q          # backend suite

# from the repo root
npx tsc --noEmit             # frontend typecheck
npm run build                # production build
```

---

## Deployment

- **Backend → Railway:** deploy from GitHub with **Root Directory = `backend`** (uses the
  `Dockerfile`). Set the backend variables above, then verify `/api/v1/health`. Point the Recall
  webhook at `https://<app>.up.railway.app/webhooks/recall`.
- **Frontend → Vercel:** set the three `NEXT_PUBLIC_` variables (with `NEXT_PUBLIC_API_BASE_URL`
  pointing at the Railway URL) and redeploy — they're inlined at build time.

Migrations do not run automatically on deploy. After any schema change, run
`alembic upgrade head` against `DIRECT_URL`. See [`backend/DEPLOY.md`](backend/DEPLOY.md) for the
full runbook and the live-capture GO/NO-GO test.

---

## Scope notes

NoteFlow is honest about its boundaries. The authenticated `/app` experience uses only real data.
A separate, clearly-marked **seeded marketing demo** lives at `/meeting/*` and `/share/*` for the
product page and is never presented as your real meetings.

Deliberately out of scope for this build: calendar-based auto-join, global keyword search (the
**Ask** feature is the substitute), user-created highlight clips (highlights are AI-derived key
moments), and multi-workspace / billing. These are documented as future work rather than shown as
non-functional controls.
