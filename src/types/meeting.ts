/**
 * Core domain types for NoteFlow.
 *
 * These are shaped by the acceptance criteria in docs/plan/PLAN.md §4. The load-bearing
 * decision is that time is expressed in **seconds** everywhere a moment in the recording
 * is referenced (`TranscriptSegment.start/end`, `Citation.start`, `ActionItem.start`).
 * That single convention lets one `seekTo(seconds)` primitive drive every navigation:
 * transcript clicks, Ask NoteFlow citations, search results, and highlights all resolve
 * to the same call. See docs/plan/PLAN.md §4 ("Build this once as a reusable primitive").
 */

/** Where a meeting's data actually came from — tracked internally, never used to dress up
 *  generated content as a genuine recording (PLAN §7). `ingested` = produced by the real
 *  AssemblyAI + Groq pipeline (Level 3) from an actual recording. */
export type MeetingSource = "real" | "demo" | "generated" | "ingested";

/** A person on the call. Doubles as the diarization identity for transcript lines. */
export interface Speaker {
  id: string;
  name: string;
  /** 1–2 letter monogram for avatars; derived from name if omitted. */
  initials?: string;
  /** Short role/company shown next to the name where useful (e.g. "Acme, VP Eng"). */
  role?: string;
}

/**
 * One diarized line of transcript.
 *
 * `start`/`end` are seconds from the recording's origin. The active segment during
 * playback is the one where `start <= currentTime < end` (PLAN §4); clicking a segment
 * seeks to its `start`.
 */
export interface TranscriptSegment {
  id: string;
  /** References {@link Speaker.id} of the meeting's participants. */
  speakerId: string;
  /** Seconds from the start of the recording (inclusive lower bound of the active window). */
  start: number;
  /** Seconds from the start of the recording (exclusive upper bound of the active window). */
  end: number;
  text: string;
}

/**
 * A jump-to-moment reference. Produced by Ask NoteFlow answers and (later) search results
 * and highlights. Clicking one calls `seekTo(start)` and scrolls the transcript to `segmentId`.
 */
export interface Citation {
  /** The transcript segment this citation points at. */
  segmentId: string;
  /** Seconds to seek to — normally the cited segment's `start`. */
  start: number;
  /** Short quoted snippet shown as the clickable link text, Fathom-style. */
  label: string;
}

/**
 * A precomputed Ask NoteFlow question/answer pair (PLAN §4 "prototype honesty": for seeded
 * meetings these are demo intelligence, not live LLM output). Answers carry timestamp
 * citations that reuse the shared seek primitive.
 */
export interface AskAnswer {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
}

/**
 * A single action item. The Action Items panel is intentionally the stricter surface
 * (PLAN §1 observed-behavior note) — only genuinely committed follow-ups live here.
 */
export interface ActionItem {
  id: string;
  text: string;
  /** Who owns the follow-up, when the transcript makes it clear. */
  owner?: string;
  /** Whether it's been marked done. */
  completed: boolean;
  /** Seconds into the recording where this was committed — enables a jump-to-context link. */
  start?: number;
  /** The transcript segment this item came from, for the same seek/scroll behavior. */
  segmentId?: string;
}

/**
 * Structured meeting summary. A flat `tldr` powers the dashboard card preview and the
 * default template; the richer fields back the "summary templates" feature (Level 1.5,
 * PLAN §3) without a later schema change.
 */
export interface MeetingSummary {
  /** One- to two-sentence gist — used for the dashboard card's line-clamped preview. */
  tldr: string;
  /** Bulleted takeaways for the default summary template. */
  keyPoints?: string[];
  /** Optional topic sections for alternate templates (e.g. decisions, risks, next steps). */
  sections?: { heading: string; points: string[] }[];
}

/**
 * A meeting and everything the post-meeting workspace renders from it.
 * `searchable` fields per PLAN §4: title, participants, summary, transcript, action items.
 */
export interface Meeting {
  id: string;
  title: string;
  /** ISO 8601 start time; the dashboard groups and relative-formats from this. */
  startedAt: string;
  /** Total recording length in seconds. */
  durationSec: number;
  participants: Speaker[];
  summary: MeetingSummary;
  transcript: TranscriptSegment[];
  actionItems: ActionItem[];
  /** Precomputed Ask NoteFlow Q&A for this meeting. */
  askAnswers: AskAnswer[];
  /** Provenance — see {@link MeetingSource}. */
  source: MeetingSource;
  /** Path under /public to a playable recording, if one exists (solo test clips only, PLAN §6). */
  recordingUrl?: string;
}
