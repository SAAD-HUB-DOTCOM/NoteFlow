# NoteFlow — Fathom.ai Clone Project Plan

**Assignment:** Build a functional clone of Fathom.ai (AI meeting notetaker) as a remote engineer take-home assignment.
**Time budget:** 24 hours
**Product name:** NoteFlow

---

## 1. What We're Actually Building (Scope)

Fathom's real product joins live Zoom/Meet/Teams calls as a bot, records, transcribes in real time, and syncs to CRMs. That full scope is not buildable solo in 24 hours with free tools.

**In scope (the MVP):**
- User logs in with Google OAuth
- User uploads a recorded meeting (audio/video file)
- Backend transcribes it with speaker diarization (who said what)
- AI generates a summary + key points + action items
- Dashboard lists past meetings; clicking one shows the transcript + summary
- Basic search across past meetings

**Out of scope (state this clearly in your README):**
- Live bot joining Zoom/Meet/Teams calls
- Real-time/live transcription during a call
- CRM integrations (Slack, HubSpot, Salesforce, etc.)
- Team workspaces, billing, multi-user permissions

Stating what you scoped out and why is part of a strong submission — it shows engineering judgment, not laziness.

---

## 2. Full Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | FastAPI (Python) | Fast to write, clean async support for polling APIs |
| Database | **Supabase (PostgreSQL)** | Supabase *is* Postgres under the hood, hosted, with a free tier — no separate DB provider needed |
| Auth | **Supabase Auth (Google OAuth provider)** | Supabase has built-in Google login support — skips writing raw OAuth flow code yourself |
| File storage | **Supabase Storage** | Store uploaded audio/video files directly in Supabase instead of your own server disk — one less thing to manage |
| Transcription + diarization | AssemblyAI | Free tier, built-in speaker labels, built-in summarization option |
| AI summarization | Groq API (`openai/gpt-oss-120b`) | Free tier, extremely fast inference |
| Frontend | Next.js + Tailwind CSS | Fast to build, easy styling, industry standard |
| Design system | `noteflow-design-system` skill (already created) | Consistent dark, indigo-accent UI across all pages |
| Hosting (optional) | Vercel (frontend) + Render (backend) | Only if a live link is required — skip if a local demo is enough |

### Why Supabase simplifies things for you
Instead of three separate pieces (a Postgres provider like Neon, a hand-rolled Google OAuth flow with Authlib, and your own file upload/storage handling), Supabase gives you all three in one dashboard:
- **Database** → real Postgres, with a visual table editor
- **Auth** → toggle on the Google provider, paste your Google Client ID/Secret, done — no `/auth/google/callback` route to write by hand
- **Storage** → a bucket for audio files, with a client library to upload directly from your frontend if you want, or through your backend

This cuts real implementation time out of your 24 hours, which matters.

---

## 3. All Resources / Accounts Needed (Checklist)

- [ ] **AssemblyAI** — assemblyai.com/app → API key ✅ (already done)
- [ ] **Groq** — console.groq.com → API key ✅ (already done)
- [ ] **Google Cloud Console** — console.cloud.google.com → OAuth Client ID + Secret (Testing mode, add yourself as test user) — needed to plug into Supabase Auth
- [ ] **Supabase** — supabase.com → new project → gives you: Postgres connection string, `anon` public key, `service_role` key, and a Google Auth provider toggle
- [ ] **Node.js** — nodejs.org (for Next.js frontend)
- [ ] **Python 3.10+** — python.org (for FastAPI backend)

### Setting up Google login inside Supabase
1. In Supabase dashboard → **Authentication → Providers → Google** → toggle it on
2. Paste your Google **Client ID** and **Client Secret** (from Google Cloud Console)
3. Supabase gives you a **Redirect URL** (looks like `https://<project-ref>.supabase.co/auth/v1/callback`) — copy this into your Google Cloud Console's **Authorized redirect URIs**
4. That's it — no custom OAuth callback route needed in your FastAPI backend; Supabase handles the token exchange

### `.env` file (backend/.env)
```
ASSEMBLYAI_API_KEY=
GROQ_API_KEY=
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres
```

### `.env.local` file (frontend/.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 4. Project Structure

```
noteflow/
├── backend/
│   ├── main.py              # FastAPI app entrypoint, routes
│   ├── database.py          # SQLAlchemy engine/session setup (points at Supabase Postgres)
│   ├── models.py            # Meeting, Transcript tables (Users handled by Supabase Auth)
│   ├── pipeline.py          # AssemblyAI + Groq processing logic
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Landing/login page (Supabase Auth UI)
│   │   ├── dashboard/page.tsx    # Meeting list
│   │   └── meeting/[id]/page.tsx # Transcript + summary view
│   ├── lib/
│   │   └── supabaseClient.ts     # Supabase JS client init
│   ├── DESIGN_SYSTEM.md          # The skill content, for reference
│   └── .env.local
└── README.md                     # Scope, setup instructions, what's out of scope
```

---

## 5. System Flow (How It All Connects)

```
1. User clicks "Login with Google" on frontend → Supabase Auth handles the whole OAuth
   round-trip → returns a session/JWT to the frontend
2. Frontend sends that JWT with requests to your FastAPI backend (in Authorization header)
3. Backend verifies the JWT against Supabase (or trusts it via Supabase's public key)
   to identify the user
4. User uploads audio/video file → stored in Supabase Storage (or passed straight through
   to your backend, then to AssemblyAI)
5. Backend sends the file/URL to AssemblyAI → transcribes + diarizes → backend polls
   until complete
6. Backend sends transcript text to Groq → gets summary + key points + action items
7. Backend stores meeting + transcript + summary in Supabase Postgres, linked to the user's ID
8. Frontend dashboard queries Supabase (directly via Supabase client, or through your
   backend) for that user's meetings → displays cards
9. User clicks a meeting → fetch full transcript + summary → render detail page
10. Search bar queries backend → simple text search across stored transcripts
```

---

## 6. Hour-by-Hour Plan (24 Hours)

| Time block | Task |
|---|---|
| **0:00 – 0:45** | Create Supabase project, enable Google provider, wire up redirect URI in Google Cloud Console. Scaffold backend + frontend folders, install dependencies. |
| **0:45 – 1:30** | Build Google login on the frontend using Supabase Auth (their JS client handles almost all of it). Confirm a real login works and a session/JWT is returned. |
| **1:30 – 2:30** | Set up Postgres tables (Meetings, Transcripts) in Supabase's table editor or via SQLAlchemy migration against the Supabase connection string. |
| **2:30 – 4:30** | Build the upload endpoint → AssemblyAI integration (upload file, submit job, poll for completion, store transcript + speaker labels). |
| **4:30 – 6:00** | Wire transcript → Groq summarization call. Store summary/key points/action items alongside transcript. |
| **6:00 – 7:00** | Test the full backend pipeline end-to-end with a real audio file via curl/Postman before touching the rest of the frontend. |
| **7:00 – 7:30** | Break / buffer time. |
| **7:30 – 9:30** | Build Next.js dashboard page (meeting list), applying the NoteFlow design system. |
| **9:30 – 12:00** | Build the meeting detail page: transcript view with speaker labels, summary panel, action items list. |
| **12:00 – 13:00** | Build the upload UI (drag-and-drop or file picker) that hits your backend endpoint. |
| **13:00 – 14:00** | Build simple search functionality (search bar on dashboard, filters meeting list). |
| **14:00 – 15:30** | Buffer / sleep block — plan for a real break here. |
| **15:30 – 17:30** | Polish UI: empty states, loading states, error handling, responsive check. |
| **17:30 – 19:00** | End-to-end testing: fresh login → upload → wait → view results → search. Fix bugs found. |
| **19:00 – 20:30** | Write the README: setup instructions, architecture overview, what's in scope vs out of scope, and how you'd extend it with more time. |
| **20:30 – 21:30** | Record a short demo video/GIF if wanted, or prepare for a live walkthrough. |
| **21:30 – 24:00** | Final buffer for unexpected issues (API limits, deploy problems, last bug fixes). |

**Using Supabase Auth instead of hand-rolled OAuth saves you roughly 1–1.5 hours compared to the original plan — that time has been folded back into the frontend build and buffer blocks above.**

---

## 7. Key Technical Details to Remember

- **AssemblyAI auth:** raw API key in `Authorization` header — no `Bearer` prefix.
- **Groq auth:** `Bearer YOUR_KEY` — different from AssemblyAI, easy to mix up.
- **Groq model to use:** `openai/gpt-oss-120b` — the free-tier-accessible model. `llama-3.3-70b-versatile` is no longer on the free plan.
- **Groq response parsing:** use `choices[0].message.content` — ignore the `reasoning` field, that's the model's internal thinking, not the final answer.
- **Speaker diarization:** enabled via `speaker_labels: true` in the AssemblyAI transcript request. Output appears in the `utterances` array with `speaker`, `text`, `start`, `end`.
- **Supabase Auth + Google:** set the Google Cloud OAuth consent screen to "Testing" mode and add your own email as a test user — skips Google's verification review entirely for a demo project. The redirect URI must come from Supabase's dashboard, not one you invent yourself.
- **Supabase Postgres connection:** found under **Project Settings → Database → Connection string** in the Supabase dashboard — use the "URI" format for `DATABASE_URL`.
- **Row-level security (RLS):** Supabase enables RLS by default on new tables — if your frontend queries Supabase directly (not just through your backend), you'll need to add a policy like "users can only read their own meetings" or queries will silently return nothing. If you only ever query through your FastAPI backend using the `service_role` key, RLS doesn't block you, since that key bypasses it.

---

## 8. What to Say in Your README (Important)

Be explicit and confident about scope — this is expected, not a weakness:

> "This is a scoped MVP of Fathom's core meeting-intelligence loop: upload → transcribe with speaker diarization → AI summary and action items → searchable dashboard. Given the 24-hour window, I deliberately excluded live meeting-bot joining, real-time transcription, and CRM integrations, as these require infrastructure beyond a solo 24-hour build. I used Supabase for auth, database, and storage to reduce infrastructure setup time and focus engineering effort on the transcription/AI pipeline itself. With more time, I'd add: [live bot joining via a meeting SDK], [Slack/HubSpot sync via webhooks], [team workspaces with role-based access]."

---

## 9. Immediate Next Step

1. Create your Supabase project (supabase.com → New Project — takes ~2 minutes to provision)
2. Enable the Google provider in **Authentication → Providers**, using your Google Cloud OAuth Client ID/Secret
3. Copy your Supabase URL, anon key, service role key, and Postgres connection string into your `.env` files

Once that's done, tell me — I'll start writing the actual backend code: `database.py`, `models.py`, and the AssemblyAI + Groq pipeline, followed by the frontend Supabase Auth login flow.
