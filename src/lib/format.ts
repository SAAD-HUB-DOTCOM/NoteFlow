/**
 * Display formatting helpers. All date formatting is done once on the server and passed
 * to the client as strings, so the client never calls `new Date()` on render — that keeps
 * relative labels ("Today", "Yesterday") free of hydration mismatches.
 */

const TIME = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const WEEKDAY_TIME = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});
const DATE_TIME = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Whole-minute duration label: 68s → "1 min", 3480s → "58 min", <30s → "<1 min". */
export function formatDuration(seconds: number): string {
  if (seconds < 30) return "<1 min";
  return `${Math.round(seconds / 60)} min`;
}

/** Precise mm:ss for players/timestamps (e.g. 1122 → "18:42"). */
export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export type DateGroup = "Today" | "This week" | "Earlier";

export interface RelativeMeetingTime {
  group: DateGroup;
  /** Order for grouping: lower sorts first. */
  groupOrder: number;
  /** Time label appropriate to the group. */
  label: string;
}

/** Bucket a meeting into Today / This week / Earlier relative to `now`, with a fitting label. */
export function relativeMeetingTime(startedAt: string, now: Date): RelativeMeetingTime {
  const date = new Date(startedAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );

  if (dayDiff <= 0) {
    return { group: "Today", groupOrder: 0, label: TIME.format(date) };
  }
  if (dayDiff === 1) {
    return { group: "This week", groupOrder: 1, label: `Yesterday, ${TIME.format(date)}` };
  }
  if (dayDiff < 7) {
    return { group: "This week", groupOrder: 1, label: WEEKDAY_TIME.format(date) };
  }
  return { group: "Earlier", groupOrder: 2, label: DATE_TIME.format(date) };
}

/** Derive 1–2 letter initials from a full name when none were provided. */
export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
