# NoteFlow backend (FastAPI)

Phase 1 foundation for the real NoteFlow full-stack build. See `docs/plan/note-flow.md`
(canonical) — TONIGHT SCOPE runs without Celery/Redis (FastAPI `BackgroundTasks` + a `jobs`
table). The Next.js frontend stays at the repo root; this `backend/` sits alongside it.

## Setup

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in Supabase/Recall/Groq values (never commit .env)
```

## Database migrations (once DATABASE_URL is set)

```bash
alembic revision --autogenerate -m "init"   # generates the first migration from app/models.py
alembic upgrade head
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- `GET /api/v1/health` — no auth; reports truthful readiness flags (db/auth/recall/groq configured).
- `GET/PATCH /api/v1/me` — requires a Supabase JWT (`Authorization: Bearer <token>`); upserts profile.
- `GET/PATCH /api/v1/preferences` — user capture/summary preferences.

## Notes

- User identity comes only from the verified Supabase JWT (`SUPABASE_JWT_SECRET`, HS256) — never
  from the request body.
- Without keys, protected routes return a truthful 503 "not configured" — never a faked session.
- Later phases add: `POST /meetings/capture` + `POST /webhooks/recall` (Phase 3), transcript +
  Groq pipeline (Phases 4–5), and the rest of the API surface in `note-flow.md` §22.
