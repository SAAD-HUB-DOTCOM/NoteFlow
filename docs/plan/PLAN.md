# NoteFlow — Fathom.video Clone: Execution Plan (v4 — Final)

**Assignment:** Rebuild a live product in 24 hours — Fathom.video, the AI meeting notetaker.
**Product name:** NoteFlow
**Judged on:** Speed (how much working product), product judgment (what you built first / left out), UX and UI quality

**Status: planning is complete. This is the execution plan. No further replanning — the next task is Phase 1 implementation.**

---

## 0. Strategy (Locked)

Visible product experience first, backend/AI as a later bonus:

```
✓ Fathom research
        ↓
✓ Public repo
        ↓
✓ 8x agent capture
        ↓
Next.js scaffold
        ↓
Types + seed-data foundation
        ↓
My Meetings
        ↓
First Vercel preview
        ↓
Meeting Workspace
        ↓
Player
        ↓
Transcript synchronization
        ↓
Summary + Actions
        ↓
Search
        ↓
Ask NoteFlow
        ↓
Sharing
        ↓
Summary templates + Highlights
        ↓
Scale + responsive polish
        ↓
Production verification
        ↓
Decision: real AI or more polish?
        ↓
README + walkthrough
```

No authentication. No database until/unless Level 3. Real AI ingestion is placed behind a decision gate, not scheduled automatically.

---

## 1. Step Zero — Product Research (Complete)

- [x] Signed up for Fathom.video, connected calendar, ran real Google Meet test calls
- [x] Reviewed: bot-free capture options, recording consent flow, live summary, transcript accuracy, empty action-items state, Ask Fathom's ability to infer soft action items even when the Action Items tab found none
- [x] Screenshots and notes committed to `docs/research/fathom/`

**Observed behavior (not a claim about Fathom's internals):** the formal Action Items experience appeared more conservative than conversational Ask Fathom responses. NoteFlow preserves that UX distinction where useful — a stricter Action Items panel, a more flexible Ask NoteFlow — without asserting anything about how Fathom is actually built.

---

## 2. Step Zero-Point-Five — Agent Capture & Repo (Complete)

- [x] 8x agent capture setup completed, test passed in a fresh Claude session
- [x] Public GitHub repo created, with `.agent-logs/` present and committed from early on
- [ ] Continue committing incrementally throughout — `docs:`, `chore:`, `feat:` prefixed commits, not one lump at the end

---

## 3. Product Scope — Priority Pyramid (Final)

Never sacrifice a lower layer to build a higher one.

```
                    BONUS
            ┌─────────────────┐
            │ Real AI upload   │
            │ AssemblyAI       │
            │ Groq             │
            └─────────────────┘

              SCALE / POLISH
        ┌─────────────────────────┐
        │ Large transcript perf    │
        │ Responsive layout        │
        │ Loading/error/empty      │
        └─────────────────────────┘

            CHEAP, HIGH-VALUE
        ┌─────────────────────────┐
        │ Summary templates         │
        │ Highlights                │
        └─────────────────────────┘

                 MUST (CORE)
    ┌─────────────────────────────────┐
    │ Meetings · Player · Transcript    │
    │ Playback ↔ transcript sync        │
    │ Summary · Actions · Search        │
    │ Ask NoteFlow · Sharing            │
    │ Deployment                        │
    └─────────────────────────────────┘

                MUST SURVIVE
 ┌─────────────────────────────────────────┐
 │ Agent capture · Public repository         │
 │ Live deployed URL · Seeded populated app  │
 │ ≤5 min walkthrough + camera               │
 └─────────────────────────────────────────┘
```

**Summary templates and one simple Highlight interaction sit at "Level 1.5"** — not essential enough to block deployment, but cheap enough (you already saw both in Fathom research) that they should make the final submission if at all possible.

### Decision gate at Hour 19 — don't start Level 3 automatically

Before touching AssemblyAI/Groq, honestly check: Does the core product work flawlessly? Is Vercel live and tested in incognito? Does sync/search/Ask/sharing all work? Is the UI polished?

**If yes to all** → proceed to real AI ingestion.
**If no to any** → spend the remaining hours fixing and polishing the core product instead. A broken AssemblyAI integration does not compensate for a mediocre meeting workspace.

---

## 4. Core Product — Acceptance Criteria

Vague requirements get interpreted loosely under time pressure. Be explicit.

### Transcript synchronization (the single most important interaction)
- Playing media marks the transcript segment whose `start <= currentTime < end` as active
- The active segment visibly highlights
- Transcript auto-scrolls when playback moves outside the visible segment
- Clicking a transcript segment seeks media to that segment's `start`
- Clicking a timestamp citation from Ask NoteFlow uses the same seek mechanism
- Search-result timestamp links use the same seek mechanism
- Highlight links use the same seek mechanism

Build this once as a reusable primitive — `seekTo(seconds)` — then reuse it everywhere above. This is the core piece of architecture the whole build hangs off of.

### Cross-meeting search — what it actually searches
Search across: meeting title, participants, summary text, transcript content, action items.

Result format should be Fathom-like, not just a title match:
```
Product Design Review
18:42 — "We agreed to deploy the new build on Vercel."
```
Clicking a result: opens the meeting → seeks to 18:42 → scrolls transcript to that segment (same `seekTo` primitive).

### Prototype honesty (important — state this explicitly)
Until/unless Level 3 (real AI ingestion) is built, summaries, action items, and Ask NoteFlow responses for seeded meetings are **precomputed demo intelligence, not live LLM generation.** The UI can still say "Ask NoteFlow" — just be upfront about this in the README and walkthrough:

> "The post-meeting intelligence experience is fully interactive; for seeded meetings, AI outputs are precomputed. Real ingestion was treated as a bonus after the core product."

This is stronger than pretending, and evaluators will respect the honesty more than they'd penalize the shortcut.

---

## 5. Tech Stack

| Layer | Choice | When |
|---|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS | From hour 0 |
| Data (core product) | Local seeded TypeScript/JSON files (`src/data/meetings.ts`) | From hour 0 |
| Hosting | Vercel | First preview deploy early (~hour 4-6), production pass later (~hour 18) |
| Transcription + diarization (bonus only) | AssemblyAI | Only after core product + decision gate |
| AI summarization (bonus only) | Groq (`openai/gpt-oss-120b`) | Only after core product + decision gate |
| Database (bonus only, optional) | Supabase (Postgres) | Only if time remains after bonus ingestion works |
| Auth | **None** | Not a judging criterion; skip entirely |

---

## 6. Project Structure

```
noteflow/
├── .agent-logs/                  # Claude Code capture logs — commit incrementally
├── docs/
│   └── research/
│       └── fathom/                # Screenshots + notes from Step Zero
├── src/
│   ├── app/
│   │   ├── page.tsx                # My Meetings (dashboard)
│   │   ├── meeting/[id]/page.tsx   # Meeting Workspace
│   │   └── share/[id]/page.tsx     # Public share page
│   ├── components/
│   │   ├── Player.tsx
│   │   ├── Transcript.tsx
│   │   ├── Summary.tsx
│   │   ├── ActionItems.tsx
│   │   ├── AskNoteFlow.tsx
│   │   └── MeetingCard.tsx
│   ├── data/
│   │   └── meetings.ts             # Seeded meeting data
│   ├── lib/
│   │   └── seekTo.ts                # Shared playback-seek primitive
│   └── types/
│       └── meeting.ts
├── public/
│   └── recordings/                 # See privacy note below
├── README.md
└── package.json

# Added later, only if the Hour 19 decision gate says yes:
├── backend/
│   ├── main.py                     # FastAPI
│   ├── pipeline.py                 # AssemblyAI + Groq
│   └── requirements.txt
```

**Privacy note on `public/recordings/`:** anything in `public/` is retrievable by anyone with the deployed URL. Only use the short solo test recording (you talking to yourself) here — never a real work meeting containing other people's voices. This keeps the public GitHub/Vercel submission safe by default.

---

## 7. Seeded Data

Be precise about "real" vs. seeded — the brief says "seed it with real data," so at least one or two meetings are genuinely from your Fathom research calls. Track the source internally (not necessarily shown in UI) — never let a generated meeting be mistaken for a real recording.

| Meeting | Duration | Participants | Source |
|---|---|---|---|
| ATX Assignment Kickoff | ~2 min | 1 | **Real** — your actual Fathom research call |
| NoteFlow Product Planning | ~1 min | 1 | **Real** — second Fathom test call, if you did one |
| Product Design Review | 58 min | 8 | Seeded demo scenario (the large-scale test case) |
| Weekly Engineering Sync | 32 min | 5 | Seeded demo scenario |
| Customer Discovery — Acme | 47 min | 3 | Seeded demo scenario |
| Launch Readiness | 26 min | 6 | Seeded demo scenario |

**Don't hand-write six full transcripts up front.** Tier the effort:
- **Real meeting(s):** full transcript from your actual recording (you have this from Fathom's transcript view already)
- **One detailed demo meeting:** enough real transcript segments to exercise every interaction — search hits, a highlight-worthy moment, 3-5 Ask NoteFlow Q&A pairs with timestamps
- **Remaining demo meetings:** realistic metadata + short summary + a few action items; lighter transcripts, expanded later only if time allows
- **The large 8-person/hour-long meeting:** generate/seed enough *structured* transcript segments (timestamps, speakers, varied line lengths) to stress-test scrolling/search/rendering — it doesn't need to be hand-written prose. What's being tested is whether the product handles a long, multi-speaker transcript, not whether every line was manually authored.

---

## 8. Hour-by-Hour Schedule (24 Hours)

| Time | Task |
|---|---|
| ✓ 0:00 – 0:30 | Repo (public), `.agent-logs/`, agent capture pass, `docs/research/fathom/` populated |
| 0:30 – 1:00 | Next.js + TypeScript + Tailwind scaffold |
| 1:00 – 2:00 | Define core meeting/transcript/action-item types. Create the seed-data structure for all 6 meetings, with full interaction-ready content for the primary demo meeting(s) and lightweight metadata/content for the rest |
| 2:00 – 4:00 | My Meetings dashboard — cards, list, design system applied |
| 4:00 – 6:00 | Meeting Workspace shell (Summary/Actions/Transcript tabs) + **first Vercel preview deployment** |
| 6:00 – 8:00 | Recording player component |
| 8:00 – 10:00 | Playback ↔ transcript synchronization (see acceptance criteria, Section 4) |
| 10:00 – 11:00 | Transcript search (within a meeting) |
| 11:00 – 12:00 | Summary + Action Items panels |
| 12:00 – 14:00 | Cross-meeting search (see acceptance criteria) + Ask NoteFlow with seeded Q&A and timestamp citations |
| 14:00 – 15:00 | Public sharing page |
| 15:00 – 15:45 | Summary templates (Level 1.5) |
| 15:45 – 16:30 | One simple Highlight interaction (Level 1.5) |
| 16:30 – 17:30 | Verify large 8-person/hour-long meeting performance; responsive layout pass |
| 17:30 – 18:00 | Loading/error/empty states |
| 18:00 – 19:00 | **Production deployment pass** + incognito verification |
| 19:00 | **Decision gate** (Section 3) — real AI ingestion, or more polish? |
| 19:00 – 21:00 | *If gate passed:* Level 3 — AssemblyAI + Groq real ingestion. *If not:* continued polish/bug-fixing on core product |
| 21:00 – 22:00 | Write README (Section 9) |
| 22:00 – 23:00 | Final bug fixing, checklist review |
| 23:00 – 24:00 | Record 5-minute walkthrough (camera on), final submission checks |

Deploying a preview early (hour 4-6) surfaces routing/build/asset issues while there's still time to fix them — the hour-18 pass then becomes verification, not first contact with production problems.

---

## 9. What to Say in Your README

> "NoteFlow recreates the highest-value post-meeting intelligence workflows of Fathom: synchronized recording and transcript playback, AI summaries, action items, meeting search, highlights, contextual AI questions with timestamp citations, and public sharing. Given the 24-hour constraint and the brief's explicit allowance to stub the capture layer, I prioritized the post-meeting experience over building meeting-platform recording infrastructure. The application is seeded with real data from my own Fathom research calls plus realistic demo scenarios, including a larger multi-participant scenario to validate transcript navigation and meeting intelligence at scale. Until real AI ingestion is added, summaries/actions/Ask NoteFlow responses for seeded meetings are precomputed demo intelligence rather than live LLM output. [If Level 3 reached:] A file-based ingestion pipeline using AssemblyAI for transcription/diarization and Groq for summarization was added as an enhancement, allowing new meetings to be created from real recordings."

---

## 10. Git Commit Strategy

```
docs: add Fathom product research
chore: configure agent capture
chore: initialize NoteFlow scaffold
feat: add seeded meeting data and types
feat: build My Meetings dashboard
chore: first Vercel preview deployment
feat: build meeting workspace shell
feat: add recording player
feat: add synchronized transcript playback
feat: add transcript search
feat: add cross-meeting search
feat: add Ask NoteFlow with timestamp citations
feat: add public sharing
feat: add summary templates and highlights
feat: verify large multi-speaker meeting performance
chore: production deployment + incognito verification
feat: add real AI ingestion pipeline (AssemblyAI + Groq)  # only if gate passed
docs: write README
```

---

## 11. Before You Submit — Final Checklist

- [ ] Live link opens for someone not signed in as you (test in incognito)
- [ ] GitHub repo is public
- [ ] `.agent-logs/` is committed, built up incrementally (check commit history, not just final state)
- [ ] Walkthrough video is ≤5 minutes, camera on
- [ ] Real seeded data is visible — not an empty meetings list, and at least one meeting is genuinely from your own Fathom research
- [ ] Transcript sync acceptance criteria (Section 4) all pass
- [ ] Cross-meeting search returns content matches, not just title matches
- [ ] The large 8-person/hour-long meeting renders and performs well
- [ ] Public share page works
- [ ] README discloses precomputed vs. live AI clearly
- [ ] `public/recordings/` contains only your solo test recording, never a real meeting with other people's voices
- [ ] Links pasted and clearly labeled (live link vs. repo)

---

## 12. Immediate Next Step

Planning is done. Start Phase 1: repository inspection → Next.js scaffold → `Meeting`/`Transcript`/`ActionItem` type definitions → seed-data foundation for the 6 meetings (tiered detail per Section 7). This is the next actual coding task.
