import type { Meeting, MeetingSummary } from "@/types/meeting";
import { formatTimestamp } from "@/lib/format";

/**
 * Cross-meeting search (PLAN §4). Searches title, participants, summary, transcript, and
 * action items — and returns *content* matches with timestamps, not just title matches, so a
 * result can jump straight into the recording via seekTo.
 *
 * The dashboard keeps full transcripts out of the client bundle, so search runs over a compact
 * text-only index built on the server (`buildSearchIndex`) and passed to the client, which then
 * queries it with `searchIndex`. In-memory is deliberate — the Weekly Engineering Sync meeting
 * decided a real index is premature for this scale.
 */

export type SearchResultKind = "transcript" | "action" | "summary" | "participant" | "title";

/** One searchable unit, flattened for the client. */
export interface SearchEntry {
  meetingId: string;
  meetingTitle: string;
  kind: SearchResultKind;
  text: string;
  start?: number;
  segmentId?: string;
}

export interface SearchResult {
  kind: SearchResultKind;
  snippet: string;
  timeLabel?: string;
  start?: number;
  segmentId?: string;
}

export interface MeetingSearchGroup {
  meetingId: string;
  meetingTitle: string;
  totalMatches: number;
  results: SearchResult[];
}

const PER_MEETING_CAP = 4;

// Order controls both index build and result priority: content matches (with timestamps) first.
const KIND_ORDER: SearchResultKind[] = ["transcript", "action", "summary", "participant", "title"];

/** Build the flat, text-only search index on the server. */
export function buildSearchIndex(meetings: Meeting[]): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const m of meetings) {
    const base = { meetingId: m.id, meetingTitle: m.title };
    for (const seg of m.transcript) {
      entries.push({ ...base, kind: "transcript", text: seg.text, start: seg.start, segmentId: seg.id });
    }
    for (const a of m.actionItems) {
      entries.push({ ...base, kind: "action", text: a.text, start: a.start, segmentId: a.segmentId });
    }
    for (const s of summaryTexts(m.summary)) {
      entries.push({ ...base, kind: "summary", text: s });
    }
    for (const p of m.participants) {
      entries.push({ ...base, kind: "participant", text: p.name });
    }
    entries.push({ ...base, kind: "title", text: m.title });
  }
  return entries;
}

/** Query the index; group by meeting, prioritize content matches, cap per meeting. */
export function searchIndex(entries: SearchEntry[], query: string): MeetingSearchGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const byMeeting = new Map<string, { title: string; results: SearchResult[] }>();

  for (const e of entries) {
    if (!e.text.toLowerCase().includes(q)) continue;
    let group = byMeeting.get(e.meetingId);
    if (!group) {
      group = { title: e.meetingTitle, results: [] };
      byMeeting.set(e.meetingId, group);
    }
    group.results.push({
      kind: e.kind,
      snippet: e.kind === "transcript" || e.kind === "summary" ? trimAround(e.text, q) : e.text,
      timeLabel: typeof e.start === "number" ? formatTimestamp(e.start) : undefined,
      start: e.start,
      segmentId: e.segmentId,
    });
  }

  const groups: MeetingSearchGroup[] = [];
  for (const [meetingId, { title, results }] of byMeeting) {
    results.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
    groups.push({
      meetingId,
      meetingTitle: title,
      totalMatches: results.length,
      results: results.slice(0, PER_MEETING_CAP),
    });
  }
  return groups;
}

export function countMatches(groups: MeetingSearchGroup[]): number {
  return groups.reduce((sum, g) => sum + g.totalMatches, 0);
}

function summaryTexts(summary: MeetingSummary): string[] {
  const out = [summary.tldr, ...(summary.keyPoints ?? [])];
  for (const section of summary.sections ?? []) out.push(...section.points);
  return out;
}

/** Window a long line to ~140 chars centered on the first match, with ellipses. */
function trimAround(text: string, q: string, radius = 70): string {
  if (text.length <= radius * 2) return text;
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text.slice(0, radius * 2) + "…";
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}
