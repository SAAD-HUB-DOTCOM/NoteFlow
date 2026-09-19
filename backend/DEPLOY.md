# NoteFlow backend — deploy & live capture test

The backend needs a **public URL** so Recall can deliver webhooks. Railway (preferred) or Render.
The DB is already migrated via `DIRECT_URL`; the deployed app only needs to connect at runtime.

## 1. Deploy to Railway (Docker, monorepo subdir)

Dashboard:
1. New Project → **Deploy from GitHub repo** → select `SAAD-HUB-DOTCOM/NoteFlow`.
2. Service **Settings → Root Directory = `backend`** (so the `Dockerfile` here is used).
3. **Variables** — add (values from your `.env`, never commit them):
   - `DATABASE_URL` (transaction pooler, **6543**)
   - `DIRECT_URL` (session pooler, 5432) — optional at runtime; used for migrations
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
   - `RECALL_API_KEY`, `RECALL_REGION=ap-northeast-1`, `RECALL_WORKSPACE_VERIFICATION_SECRET`
   - `GROQ_API_KEY`, `GROQ_MODEL=openai/gpt-oss-120b`
   - `FRONTEND_URL` = your Vercel URL **and** local dev, comma-separated, e.g.
     `https://note-flow-eight-blue.vercel.app,http://localhost:3000`
4. Deploy. Confirm health: `curl https://<railway-app>.up.railway.app/api/v1/health` →
   `{"status":"ok","database_configured":true,"auth_configured":true,"recall_configured":true,...}`

CLI alternative (if `railway` is logged in): `cd backend && railway up`.

## 2. Register the Recall webhook

Recall dashboard → Webhooks → add endpoint:
`https://<railway-app>.up.railway.app/webhooks/recall`
Subscribe to bot status-change + recording/transcript events. The endpoint verifies the
`webhook-*` signature with `RECALL_WORKSPACE_VERIFICATION_SECRET` and is idempotent.

## 3. Point the deployed frontend at the backend

Vercel → Project → Settings → Environment Variables (Production):
- `NEXT_PUBLIC_API_BASE_URL = https://<railway-app>.up.railway.app`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
Then **redeploy** (these are inlined at build time).

Also ensure Supabase → Auth → URL config has `https://<your-vercel-domain>/auth/callback` in the
redirect allowlist, and the Google OAuth client's authorized redirect includes the Supabase
`/auth/v1/callback`.

## 4. Real Google Meet bot test (the GO/NO-GO)

1. Open a real Google Meet (meet.google.com) in one tab.
2. In the deployed app (incognito): sign in with Google → `/app/meetings` → **Record meeting** →
   paste the Meet URL → **Send NoteFlow notetaker**.
3. Expect: the modal shows a `joining` status; within ~30s the **NoteFlow Notetaker bot appears in
   the Meet** and asks to be admitted — admit it.
4. Watch status transition via webhooks: `joining → recording` (Phase 4 adds
   `recording_complete → transcribing → …`). Confirm in the DB (Supabase table editor → `meetings`)
   that a row exists with your `recall_bot_id` and updating `status`.

If the bot never appears: check Railway logs for the `/api/v1/meetings/capture` call and the Recall
response; check the Recall dashboard for the bot. If capture 401s, see the JWT note below.

## Local smoke test (no deploy)

- Backend: `cd backend && uvicorn app.main:app --port 8000` (reads `.env`).
- Frontend: root `.env.local` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` +
  `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`; `npm run dev`; sign in; Record meeting.
  (Recall webhooks won't reach localhost without a tunnel — capture still works; status updates
  need the public deploy or a tunnel like cloudflared/ngrok → `/webhooks/recall`.)

## JWT signing note (HS256 vs asymmetric)

Backend verifies Supabase JWTs as **HS256** with `SUPABASE_JWT_SECRET`. If the real browser login
returns 401 at the backend, the project likely uses **asymmetric signing keys** (RS256/ES256) — the
verifier then needs JWKS support. Ask Claude to add it; it's a localized change in
`app/security.py`.

## Migrations (future changes only)

DB already migrated. For later schema changes: `cd backend && alembic revision --autogenerate -m "…"`
then `alembic upgrade head` — both use `DIRECT_URL` (session pooler, 5432).
