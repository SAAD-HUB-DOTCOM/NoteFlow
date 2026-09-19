import type {
  Meeting,
  Speaker,
  TranscriptSegment,
  ActionItem,
  AskAnswer,
} from "@/types/meeting";

/**
 * Seed data foundation (PLAN §7 — tiered effort).
 *
 *   real      → ATX Assignment Kickoff, NoteFlow Product Planning.
 *               Metadata + summaries are genuine (from the author's own Fathom research
 *               calls, captured in docs/research/fanthom/). Full transcript text is pasted
 *               from Fathom's transcript view — nothing here is invented dialogue.
 *   demo/rich → Weekly Engineering Sync: full interaction-ready content (contiguous
 *               transcript, action items, and 4 Ask NoteFlow Q&A pairs with citations).
 *   demo/light→ Customer Discovery — Acme, Launch Readiness: realistic metadata + summary
 *               + a few action items + a light representative transcript.
 *   generated → Product Design Review (58 min, 8 people): structurally generated segments to
 *               stress-test scrolling/search/rendering, with a few hand-placed "anchor" lines
 *               at known timestamps (incl. the PLAN §4 canonical search hit at 18:42).
 *
 * All timestamps are seconds from the recording origin, per the seekTo() convention in
 * src/types/meeting.ts. Generation is deterministic (no Math.random) so SSR and client
 * render identical output and search results are stable.
 */

// ─── People ────────────────────────────────────────────────────────────────

const SPEAKERS = {
  saad: { id: "saad", name: "Saad Ullah", initials: "SU" },
  priya: { id: "priya", name: "Priya Nair", initials: "PN", role: "Eng Lead" },
  marcus: { id: "marcus", name: "Marcus Bell", initials: "MB", role: "Backend" },
  lena: { id: "lena", name: "Lena Ortiz", initials: "LO", role: "Frontend" },
  tomas: { id: "tomas", name: "Tomás Reyes", initials: "TR", role: "Platform" },
  dana: { id: "dana", name: "Dana Whitfield", initials: "DW", role: "Product" },
  aisha: { id: "aisha", name: "Aisha Khan", initials: "AK", role: "Design Lead" },
  ravi: { id: "ravi", name: "Ravi Menon", initials: "RM", role: "Design" },
  grace: { id: "grace", name: "Grace Liu", initials: "GL", role: "Research" },
  jordan: { id: "jordan", name: "Jordan Pierce", initials: "JP", role: "Acme, VP Ops" },
  kelly: { id: "kelly", name: "Kelly Song", initials: "KS", role: "Acme, Analyst" },
  nina: { id: "nina", name: "Nina Alvarez", initials: "NA", role: "Marketing" },
  oscar: { id: "oscar", name: "Oscar Reynolds", initials: "OR", role: "Support" },
} satisfies Record<string, Speaker>;

// ─── Real meetings (PLAN §7 "Real") ──────────────────────────────────────────
// Summaries/metadata are genuine (from docs/research/fanthom/my-meetings.png).
// Transcript arrays are intentionally empty until the author's Fathom transcript
// export is pasted in — no placeholder dialogue is invented here.

const atxKickoff: Meeting = {
  id: "atx-assignment-kickoff",
  title: "ATX Assignment Kickoff",
  startedAt: "2026-09-19T09:14:00",
  durationSec: 132, // ~2 min
  source: "real",
  participants: [SPEAKERS.saad],
  summary: {
    tldr:
      "Saad kicked off cloning Fathom to complete an ATX.careers take-home. He framed the project as a key step toward joining ATX and set the goal of shipping a working, deployed product within 24 hours.",
    keyPoints: [
      "Project is a 24-hour take-home: rebuild Fathom.video as “NoteFlow”.",
      "Motivation: land a role at ATX; treat this as a portfolio-grade build.",
      "First priority is a visible, deployed product over backend/AI plumbing.",
    ],
  },
  transcript: [], // TODO: paste from Fathom transcript export
  actionItems: [
    { id: "atx-a1", text: "Scaffold the Next.js app and get a live Vercel preview up early.", owner: "Saad Ullah", completed: false },
    { id: "atx-a2", text: "Seed the app with real research-call data before building UI.", owner: "Saad Ullah", completed: false },
  ],
  askAnswers: [],
};

const productPlanning: Meeting = {
  id: "noteflow-product-planning",
  title: "NoteFlow Product Planning",
  startedAt: "2026-09-19T10:02:00",
  durationSec: 68, // ~1 min
  source: "real",
  participants: [SPEAKERS.saad],
  summary: {
    tldr:
      "Saad locked the stack (Next.js on Vercel) and named recording↔transcript sync as the single core feature to nail first. He committed to finishing the dashboard UI by Saturday 8pm and wiring transcripts before Sunday to hit the submission deadline.",
    keyPoints: [
      "Stack decision: Next.js + TypeScript + Tailwind, deployed on Vercel.",
      "Core interaction to prioritize: playback ↔ transcript synchronization.",
      "Milestones: dashboard UI by Sat 8pm; transcript integration before Sun.",
    ],
  },
  transcript: [], // TODO: paste from Fathom transcript export
  actionItems: [
    { id: "plan-a1", text: "Build seekTo() as a shared primitive and reuse it everywhere.", owner: "Saad Ullah", completed: false },
    { id: "plan-a2", text: "Finish My Meetings dashboard UI by Saturday 8pm.", owner: "Saad Ullah", completed: false },
    { id: "plan-a3", text: "Integrate transcript sync before Sunday.", owner: "Saad Ullah", completed: false },
  ],
  askAnswers: [],
};

// ─── Detailed demo meeting (PLAN §7 "one detailed demo meeting") ─────────────
// Full interaction-ready content: contiguous transcript, action items, and Ask Q&A.

const engSyncTranscript: TranscriptSegment[] = [
  { id: "es-1", speakerId: "dana", start: 8, end: 21, text: "Alright, weekly sync. Let's keep it tight today — I want to get out ahead of the launch review on Thursday. Priya, where are we on the transcript sync work?" },
  { id: "es-2", speakerId: "priya", start: 21, end: 47, text: "Good progress. The core seekTo primitive is done and the transcript highlights the active segment as playback moves. Auto-scroll works, and clicking a line seeks the player. That's the piece everything else hangs off, so I'm glad it's solid." },
  { id: "es-3", speakerId: "priya", start: 47, end: 63, text: "The one rough edge is auto-scroll fighting the user when they scroll up manually to read back. We should pause auto-scroll while they're scrolling and resume after a couple seconds of inactivity." },
  { id: "es-4", speakerId: "lena", start: 63, end: 82, text: "I can take that. It's a small state machine — a 'user is scrolling' flag with a debounce. I'll also make the active segment not re-center if it's already comfortably in view, so it doesn't twitch on every segment change." },
  { id: "es-5", speakerId: "dana", start: 82, end: 90, text: "Perfect. That twitch was the top complaint in the hallway test last week." },
  { id: "es-6", speakerId: "marcus", start: 96, end: 124, text: "On the backend side — search. Right now we only match meeting titles. I'm extending it to search transcript text, summaries, participants, and action items, and returning the matching segment with its timestamp so a result can jump straight into the recording." },
  { id: "es-7", speakerId: "marcus", start: 124, end: 141, text: "The index is small enough that I'm doing it in memory for now. If we get to thousands of meetings we'll want something real, but that's premature today." },
  { id: "es-8", speakerId: "priya", start: 141, end: 152, text: "Agreed, don't build the warehouse before we have the groceries. In-memory is right for the demo and probably for launch." },
  { id: "es-9", speakerId: "tomas", start: 158, end: 186, text: "Platform update: the large meeting — the 58-minute eight-person design review — was our stress case. It renders fine now that the transcript is virtualized. Before that, dropping 350 segments into the DOM at once janked the scroll badly on my machine." },
  { id: "es-10", speakerId: "tomas", start: 186, end: 203, text: "The other thing I want to flag: we should measure time-to-interactive on that page specifically, because it's the worst case a reviewer will click into." },
  { id: "es-11", speakerId: "dana", start: 203, end: 214, text: "Good call. Let's make the big meeting the thing we screenshot for the walkthrough — if it's smooth, everything smaller is smooth." },
  { id: "es-12", speakerId: "lena", start: 220, end: 244, text: "Design-wise I pushed on the dashboard cards. Instead of identical rounded boxes I'm using a left waveform rail with the duration on it, and the summary preview clamped to two lines. The most recent meeting gets a slightly stronger treatment so your eye lands on it first." },
  { id: "es-13", speakerId: "aisha", start: 244, end: 262, text: "Love that. The thing to protect is calm — this is a tool people leave open all day, so no shadows-everywhere, no hover animations on every card. Let hierarchy do the work, not effects." },
  { id: "es-14", speakerId: "marcus", start: 268, end: 289, text: "One decision we need: do action items stay strict — only things people actually committed to — or do we infer softer ones? Ask NoteFlow can already infer soft follow-ups conversationally." },
  { id: "es-15", speakerId: "dana", start: 289, end: 312, text: "Keep the Action Items panel strict. If we put maybes in there, people stop trusting the list. Let Ask NoteFlow be the flexible surface for 'what might I need to follow up on.' Two different jobs." },
  { id: "es-16", speakerId: "priya", start: 312, end: 324, text: "That matches what we saw in research too — the formal action list was conservative, the conversational answers were looser. We're deliberately preserving that split." },
  { id: "es-17", speakerId: "tomas", start: 330, end: 351, text: "Deployment: I set up the Vercel project and preview deploys on every push. Production is a manual promote for now so we don't ship a broken build mid-demo. Incognito check is on my list before Thursday." },
  { id: "es-18", speakerId: "dana", start: 351, end: 366, text: "Great. Let's lock the plan: Lena on auto-scroll polish, Marcus on cross-meeting search, Tomás verifies the big-meeting performance and the incognito deploy. Anything blocking?" },
  { id: "es-19", speakerId: "lena", start: 366, end: 374, text: "Nothing blocking. I'll have the scroll fix in review by end of day tomorrow." },
  { id: "es-20", speakerId: "marcus", start: 374, end: 388, text: "Same. Search PR up tomorrow, with the result format showing the quote and timestamp, not just the title." },
  { id: "es-21", speakerId: "dana", start: 388, end: 402, text: "Then that's a wrap. Thanks everyone — this is coming together faster than I expected. Let's not gold-plate; ship the core, then polish." },
];

const engSync: Meeting = {
  id: "weekly-engineering-sync",
  title: "Weekly Engineering Sync",
  startedAt: "2026-09-18T15:30:00",
  durationSec: 1920, // 32 min (transcript covers the decision-dense first stretch)
  source: "demo",
  participants: [SPEAKERS.priya, SPEAKERS.marcus, SPEAKERS.lena, SPEAKERS.tomas, SPEAKERS.dana],
  summary: {
    tldr:
      "The team confirmed transcript↔playback sync is solid and split the remaining core work: auto-scroll polish, cross-meeting search returning quotes with timestamps, and performance-verifying the large multi-speaker meeting. They decided to keep Action Items strict and let Ask NoteFlow handle softer follow-ups.",
    keyPoints: [
      "seekTo sync primitive is done; auto-scroll needs a pause-on-manual-scroll fix.",
      "Search is expanding beyond titles to transcript, summary, participants, and action items.",
      "The 58-min / 8-person meeting is the performance stress case; transcript is virtualized.",
      "Decision: Action Items stays strict; Ask NoteFlow is the flexible follow-up surface.",
      "Vercel preview deploys on every push; production stays a manual promote.",
    ],
    sections: [
      { heading: "Decisions", points: ["Action Items panel stays strict — no inferred maybes.", "In-memory search index is sufficient for launch.", "Production deploys are a manual promote, not automatic."] },
      { heading: "Risks", points: ["Auto-scroll fighting manual scroll-back.", "Time-to-interactive on the largest meeting page."] },
    ],
  },
  transcript: engSyncTranscript,
  actionItems: [
    { id: "es-ai-1", text: "Fix auto-scroll to pause while the user scrolls manually and resume after inactivity.", owner: "Lena Ortiz", completed: false, start: 63, segmentId: "es-4" },
    { id: "es-ai-2", text: "Extend search to transcript, summaries, participants, and action items; return segment + timestamp.", owner: "Marcus Bell", completed: false, start: 96, segmentId: "es-6" },
    { id: "es-ai-3", text: "Verify large 8-person meeting performance and measure time-to-interactive.", owner: "Tomás Reyes", completed: true, start: 186, segmentId: "es-10" },
    { id: "es-ai-4", text: "Run the incognito production-deploy check before Thursday's launch review.", owner: "Tomás Reyes", completed: false, start: 330, segmentId: "es-17" },
  ],
  askAnswers: [
    {
      id: "es-q1",
      question: "What did we decide about action items versus Ask NoteFlow?",
      answer:
        "The Action Items panel stays strict — only follow-ups people actually committed to — so the list stays trustworthy. Softer, inferred follow-ups belong to Ask NoteFlow instead. Dana framed them as two different jobs, and Priya noted it mirrors the conservative-list / flexible-answers split seen in research.",
      citations: [
        { segmentId: "es-15", start: 289, label: "Keep the Action Items panel strict…" },
        { segmentId: "es-16", start: 312, label: "the formal action list was conservative…" },
      ],
    },
    {
      id: "es-q2",
      question: "Who owns the search work and what will it cover?",
      answer:
        "Marcus owns search. He's extending it beyond title matching to cover transcript text, summaries, participants, and action items, and each result returns the matching segment with its timestamp so it can jump straight into the recording. The index stays in memory for now.",
      citations: [
        { segmentId: "es-6", start: 96, label: "search transcript text, summaries, participants, and action items" },
        { segmentId: "es-20", start: 374, label: "the result format showing the quote and timestamp" },
      ],
    },
    {
      id: "es-q3",
      question: "Are there any performance concerns?",
      answer:
        "Yes — the 58-minute, eight-person design review is the stress case. Rendering all ~350 segments at once janked scrolling until Tomás virtualized the transcript. He wants to measure time-to-interactive on that page specifically since it's the worst case a reviewer will open.",
      citations: [
        { segmentId: "es-9", start: 158, label: "dropping 350 segments into the DOM at once janked the scroll" },
        { segmentId: "es-10", start: 186, label: "measure time-to-interactive on that page" },
      ],
    },
    {
      id: "es-q4",
      question: "What's the deployment setup?",
      answer:
        "Tomás set up the Vercel project with a preview deploy on every push. Production is a manual promote for now to avoid shipping a broken build mid-demo, and he still needs to run an incognito check before Thursday.",
      citations: [{ segmentId: "es-17", start: 330, label: "preview deploys on every push… Production is a manual promote" }],
    },
  ],
};

// ─── Lighter demo meetings (PLAN §7 "Remaining demo meetings") ───────────────

const acmeDiscovery: Meeting = {
  id: "customer-discovery-acme",
  title: "Customer Discovery — Acme",
  startedAt: "2026-09-15T11:00:00",
  durationSec: 2820, // 47 min
  source: "demo",
  participants: [SPEAKERS.dana, SPEAKERS.jordan, SPEAKERS.kelly],
  summary: {
    tldr:
      "Acme's ops team spends hours each week hand-writing recaps after customer calls and loses action items in the noise. They were most excited by searchable transcripts and timestamped answers, and flagged security review as the main hurdle to rolling NoteFlow out.",
    keyPoints: [
      "Biggest pain: manual post-call recaps eat ~4 hours/week per rep.",
      "Action items get lost; nothing links a follow-up back to what was said.",
      "Strong interest in cross-meeting search and timestamp citations.",
      "Procurement blocker: a security/compliance review before any rollout.",
    ],
  },
  transcript: [
    { id: "ac-1", speakerId: "dana", start: 24, end: 41, text: "Thanks for the time. Before I show anything — walk me through what actually happens after one of your customer calls today." },
    { id: "ac-2", speakerId: "jordan", start: 41, end: 72, text: "Honestly? Someone volunteers to write the recap, it takes forty-five minutes, and half the follow-ups still slip because they're buried in a wall of notes. Multiply that across a team and it's most of a day every week." },
    { id: "ac-3", speakerId: "kelly", start: 72, end: 98, text: "And when a deal drags on for months, nobody can find the moment where the customer said the thing that mattered. We scrub recordings by hand. If I could just search across every call for a phrase and land on that timestamp, that alone would sell me." },
    { id: "ac-4", speakerId: "dana", start: 98, end: 112, text: "That's exactly the interaction we lead with — search hits show the quote and the time, and clicking jumps you straight into the recording." },
    { id: "ac-5", speakerId: "jordan", start: 640, end: 668, text: "The one thing that'll decide whether we can adopt this is security. Anything with our customer conversations goes through a review — where recordings live, who can see a shared link, data retention. Get me a one-pager on that and I can start the process." },
    { id: "ac-6", speakerId: "kelly", start: 1520, end: 1548, text: "Sharing matters too. Half the value is sending a teammate the exact moment, not the whole hour. If a public link opens to the right timestamp, that's the workflow." },
  ],
  actionItems: [
    { id: "ac-ai-1", text: "Send Acme a security & data-retention one-pager (storage location, share-link access, retention).", owner: "Dana Whitfield", completed: false, start: 640, segmentId: "ac-5" },
    { id: "ac-ai-2", text: "Follow up with a tailored demo focused on cross-meeting search and shareable timestamped links.", owner: "Dana Whitfield", completed: false, start: 1520, segmentId: "ac-6" },
  ],
  askAnswers: [
    {
      id: "ac-q1",
      question: "What's the main blocker to Acme adopting NoteFlow?",
      answer:
        "A security and compliance review. Jordan said anything touching their customer conversations has to go through review — where recordings are stored, who can access a shared link, and data retention — and asked for a one-pager to kick off procurement.",
      citations: [{ segmentId: "ac-5", start: 640, label: "The one thing that'll decide whether we can adopt this is security." }],
    },
  ],
};

const launchReadiness: Meeting = {
  id: "launch-readiness",
  title: "Launch Readiness",
  startedAt: "2026-09-11T16:00:00",
  durationSec: 1560, // 26 min
  source: "demo",
  participants: [SPEAKERS.priya, SPEAKERS.marcus, SPEAKERS.tomas, SPEAKERS.dana, SPEAKERS.nina, SPEAKERS.oscar],
  summary: {
    tldr:
      "Go/no-go for launch. Core flows are green and the production deploy passed an incognito check; the team agreed to ship with public sharing on and real AI ingestion held back as a fast-follow. Support and marketing aligned on messaging that summaries are precomputed for seeded meetings.",
    keyPoints: [
      "Go decision: ship the core post-meeting experience now.",
      "Production verified in incognito; share links open for signed-out users.",
      "Real AI ingestion (AssemblyAI + Groq) is a post-launch fast-follow, not a blocker.",
      "Messaging: be upfront that seeded-meeting AI outputs are precomputed.",
    ],
  },
  transcript: [
    { id: "lr-1", speakerId: "dana", start: 15, end: 34, text: "This is our go/no-go. I want a clear read from each area, then a decision. Priya — core product?" },
    { id: "lr-2", speakerId: "priya", start: 34, end: 58, text: "Green. Sync, search, summaries, action items, Ask, and sharing all work end to end. The large meeting performs. I'd ship it." },
    { id: "lr-3", speakerId: "tomas", start: 58, end: 80, text: "Production's up and I verified it in incognito — a share link opens for someone not signed in. That was the risk I cared about most and it's clean." },
    { id: "lr-4", speakerId: "nina", start: 300, end: 330, text: "For messaging I want us to be honest that AI outputs on the seeded meetings are precomputed, not live generation. Evaluators respect that more than a vague claim, and it's the truth." },
    { id: "lr-5", speakerId: "oscar", start: 720, end: 748, text: "Support's ready as long as that's clear in the README. The question we'll get is 'is this really doing AI,' and the honest precomputed-versus-live line answers it." },
    { id: "lr-6", speakerId: "dana", start: 1180, end: 1200, text: "Then it's a go. Ship the core, keep real ingestion as the fast-follow, and land the messaging exactly as Nina said." },
  ],
  actionItems: [
    { id: "lr-ai-1", text: "Publish the README with a clear precomputed-vs-live AI disclosure.", owner: "Nina Alvarez", completed: false, start: 300, segmentId: "lr-4" },
    { id: "lr-ai-2", text: "Keep production as manual-promote through launch week; re-run incognito check after each promote.", owner: "Tomás Reyes", completed: true, start: 58, segmentId: "lr-3" },
    { id: "lr-ai-3", text: "Scope AssemblyAI + Groq ingestion as the first post-launch fast-follow.", owner: "Marcus Bell", completed: false, start: 1180, segmentId: "lr-6" },
  ],
  askAnswers: [
    {
      id: "lr-q1",
      question: "Did we decide to launch, and what's held back?",
      answer:
        "Yes — it's a go. Every core flow is green and production passed an incognito share-link check. Real AI ingestion (AssemblyAI + Groq) is deliberately held back as a post-launch fast-follow, and the README will state plainly that seeded-meeting AI outputs are precomputed rather than live.",
      citations: [
        { segmentId: "lr-3", start: 58, label: "I verified it in incognito — a share link opens for someone not signed in" },
        { segmentId: "lr-6", start: 1180, label: "it's a go. Ship the core, keep real ingestion as the fast-follow" },
      ],
    },
  ],
};

// ─── Generated large meeting (PLAN §7 "8-person / hour-long") ─────────────────
// Structurally generated so we can stress-test scroll/search/render on a long,
// multi-speaker transcript without hand-writing an hour of prose. A handful of
// "anchor" lines are hand-placed at known timestamps so search/citation demos
// have real, quotable content — including the PLAN §4 canonical hit at 18:42.

const DESIGN_REVIEW_SPEAKERS: Speaker[] = [
  SPEAKERS.aisha, SPEAKERS.ravi, SPEAKERS.grace, SPEAKERS.priya,
  SPEAKERS.lena, SPEAKERS.dana, SPEAKERS.marcus, SPEAKERS.tomas,
];

// Hand-placed anchor lines keyed by their start time (seconds).
const DESIGN_REVIEW_ANCHORS: Record<number, { speakerId: string; text: string }> = {
  1122: { speakerId: "tomas", text: "Okay, that's decided then — we agreed to deploy the new build on Vercel." }, // 18:42 (PLAN §4)
  312: { speakerId: "aisha", text: "The hero of this screen should be the recording, not the chrome around it. Everything else steps back." },
  905: { speakerId: "grace", text: "In testing, people scanned the summary first and only opened the transcript when a line surprised them — so the summary has to earn trust on its own." },
  1740: { speakerId: "lena", text: "Let's cap the transcript column at a readable measure; full-width lines are exhausting to read for an hour." },
  2460: { speakerId: "dana", text: "Decision: Action Items stays strict, and anything softer lives in Ask NoteFlow. We're not blurring those two." },
  3010: { speakerId: "priya", text: "For the big meetings we virtualize the transcript, so a fifty-eight-minute call scrolls as smoothly as a two-minute one." },
};

// Rotating filler lines — varied lengths, on-topic for a product design review.
const DESIGN_REVIEW_LINES: string[] = [
  "I think the hierarchy reads well now, but the secondary actions are competing with the primary one.",
  "Can we see the mobile breakpoint? I want to make sure the transcript and player stack cleanly.",
  "The empty state needs a real sentence, not just an icon — tell people what to do next.",
  "Contrast on the muted timestamps might be a hair low against the surface; let's check it against the tokens.",
  "I like the waveform thumbnail, but let's make sure it never looks like a real audio meter people can click.",
  "Where does the share action live? It should be reachable without opening a menu.",
  "The active transcript line should be obvious at a glance without shouting — a left accent bar, maybe.",
  "Let's not animate every hover. Motion should mean something changed, not decorate the page.",
  "The speaker labels are doing a lot of work; keeping them in the accent color helps scanning.",
  "For search results, the quote plus the timestamp is the whole value — don't bury it under the title.",
  "Do we need a filter here, or is that premature? I'd ship without it and add it if people ask.",
  "The date grouping — Today, This week, Earlier — matches how people actually think about their calls.",
  "One radius on everything flattens the hierarchy; the card and the badge shouldn't share a corner.",
  "Can the summary preview clamp to two lines everywhere so the cards stay a predictable height?",
  "I'd pull the duration onto the thumbnail so the eye gets it without reading.",
  "Let's make sure keyboard focus is visible on every interactive element, including the transcript lines.",
  "The loading state should hold the layout so nothing jumps when the data arrives.",
  "If we highlight a search term in the transcript, keep it subtle — underline or a faint tint, not a marker.",
  "Agreed. Let's write that down as a decision so we don't relitigate it next week.",
  "That's a good point — can you own the follow-up on it and bring numbers back?",
];

function generateDesignReviewTranscript(): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const speakerCount = DESIGN_REVIEW_SPEAKERS.length;
  let t = 6; // first line starts at 0:06
  let i = 0;

  while (t < 3480) {
    // 58:00
    const anchor = DESIGN_REVIEW_ANCHORS[t];
    // Deterministic, varied line length: 7–34s cycling by index.
    const dur = 7 + ((i * 7) % 28);
    const end = Math.min(t + dur, 3480);

    if (anchor) {
      segments.push({ id: `dr-${i}`, speakerId: anchor.speakerId, start: t, end, text: anchor.text });
    } else {
      const speaker = DESIGN_REVIEW_SPEAKERS[i % speakerCount];
      const text = DESIGN_REVIEW_LINES[(i * 3) % DESIGN_REVIEW_LINES.length];
      segments.push({ id: `dr-${i}`, speakerId: speaker.id, start: t, end, text });
    }
    t = end;
    i += 1;
  }

  // Ensure every anchor landed exactly on a segment boundary; if any anchor time
  // was skipped by the stepping, splice it in at the right position.
  for (const [startStr, anchor] of Object.entries(DESIGN_REVIEW_ANCHORS)) {
    const start = Number(startStr);
    if (!segments.some((s) => s.start === start)) {
      const idx = segments.findIndex((s) => s.start > start);
      const insertAt = idx === -1 ? segments.length : idx;
      segments.splice(insertAt, 0, {
        id: `dr-anchor-${start}`,
        speakerId: anchor.speakerId,
        start,
        end: start + 12,
        text: anchor.text,
      });
    }
  }

  return segments;
}

const designReview: Meeting = {
  id: "product-design-review",
  title: "Product Design Review",
  startedAt: "2026-09-17T13:00:00",
  durationSec: 3480, // 58 min
  source: "generated",
  participants: DESIGN_REVIEW_SPEAKERS,
  summary: {
    tldr:
      "A full design review of the NoteFlow workspace with the design, research, and engineering teams. The group aligned on making the recording the hero, keeping the summary trustworthy on its own, capping the transcript to a readable measure, and virtualizing long transcripts for performance. They confirmed the strict-Action-Items / flexible-Ask split and agreed to deploy the new build on Vercel.",
    keyPoints: [
      "The recording is the hero of the workspace; chrome steps back.",
      "Summary must earn trust on its own — people scan it before the transcript.",
      "Transcript column is capped to a readable measure and virtualized for long calls.",
      "Confirmed: Action Items strict, Ask NoteFlow flexible.",
      "Decision: deploy the new build on Vercel.",
    ],
    sections: [
      { heading: "Decisions", points: ["Deploy the new build on Vercel.", "Cap transcript width to a readable measure.", "Virtualize transcripts for long meetings."] },
    ],
  },
  transcript: generateDesignReviewTranscript(),
  actionItems: [
    { id: "dr-ai-1", text: "Deploy the new build to Vercel and share the preview link.", owner: "Tomás Reyes", completed: false, start: 1122, segmentId: "dr-anchor-1122" },
    { id: "dr-ai-2", text: "Cap the transcript column to a readable measure and re-check on mobile.", owner: "Lena Ortiz", completed: false, start: 1740 },
    { id: "dr-ai-3", text: "Confirm transcript virtualization holds time-to-interactive on the 58-min meeting.", owner: "Priya Nair", completed: true, start: 3010 },
  ],
  askAnswers: [
    {
      id: "dr-q1",
      question: "Where did we decide to deploy?",
      answer:
        "The team agreed to deploy the new build on Vercel — Tomás closed that thread out as a decision during the review.",
      citations: [{ segmentId: "dr-anchor-1122", start: 1122, label: "we agreed to deploy the new build on Vercel" }],
    },
    {
      id: "dr-q2",
      question: "What did research find about how people use the workspace?",
      answer:
        "Grace reported that in testing people scanned the summary first and only opened the transcript when a specific line surprised them. The takeaway: the summary has to earn trust on its own, because it's the primary surface most people read.",
      citations: [{ segmentId: "dr-anchor-905", start: 905, label: "people scanned the summary first…" }],
    },
    {
      id: "dr-q3",
      question: "How are we handling performance on long meetings?",
      answer:
        "Long transcripts are virtualized, so a 58-minute call scrolls as smoothly as a short one. Priya owns confirming that virtualization holds time-to-interactive on this meeting specifically, since it's the worst case.",
      citations: [{ segmentId: "dr-anchor-3010", start: 3010, label: "we virtualize the transcript…" }],
    },
  ],
};

// ─── Export ──────────────────────────────────────────────────────────────────
// Ordered newest-first; the dashboard groups by date from startedAt.

export const meetings: Meeting[] = [
  productPlanning,
  atxKickoff,
  engSync,
  designReview,
  acmeDiscovery,
  launchReadiness,
];

export function getMeeting(id: string): Meeting | undefined {
  return meetings.find((m) => m.id === id);
}
