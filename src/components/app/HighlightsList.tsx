"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type HighlightDTO } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { BookmarkFilledIcon, PlayIcon } from "@/components/icons";
import { EmptyCard, ErrorCard, ListSkeleton, ListToolbar, ListNoResults } from "@/components/app/ActionItemsList";

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
function shortDate(v: string): string | null {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : SHORT_DATE.format(d);
}

type Bucket = "Today" | "Yesterday" | "This week" | "Earlier";
const BUCKET_ORDER: Bucket[] = ["Today", "Yesterday", "This week", "Earlier"];
function bucketOf(v: string, now: Date): Bucket {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startToday - startD) / 86_400_000);
  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return "This week";
  return "Earlier";
}

/** A decorative monochrome waveform sliver (brand character, seeded — never implies a range). */
function MiniWave({ seed, className = "" }: { seed: string; className?: string }) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  let s = (h >>> 0) || 1;
  const bars = Array.from({ length: 22 }, (_, i) => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    const j = (s % 1000) / 1000;
    const env = Math.sin((i / 21) * Math.PI) * 0.35 + 0.5;
    return Math.max(16, Math.round((0.3 + j * 0.7) * env * 100));
  });
  return (
    <div aria-hidden="true" className={`flex h-6 items-center gap-[2px] ${className}`}>
      {bars.map((b, i) => (
        <span key={i} className="w-[2px] rounded-full" style={{ height: `${b}%`, background: "#fff", opacity: 0.18 + (b / 100) * 0.24 }} />
      ))}
    </div>
  );
}

/** Highlights — key moments across every meeting's real intelligence (owner-scoped). */
export function HighlightsList() {
  const [items, setItems] = useState<HighlightDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [meeting, setMeeting] = useState("all");

  const load = useCallback(async () => {
    try {
      setItems(await apiFetch<HighlightDTO[]>("/api/v1/highlights"));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load your highlights.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const meetingOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const h of items ?? []) if (!seen.has(h.meeting_id)) seen.set(h.meeting_id, h.meeting_title);
    return [{ value: "all", label: "All meetings" }, ...[...seen].map(([value, label]) => ({ value, label }))];
  }, [items]);

  const now = useMemo(() => new Date(), [items]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = (items ?? []).filter((h) => {
      if (meeting !== "all" && h.meeting_id !== meeting) return false;
      if (q && !`${h.title} ${h.meeting_title}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const map = new Map<Bucket, HighlightDTO[]>();
    for (const h of filtered) {
      const b = bucketOf(h.meeting_date, now);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(h);
    }
    return BUCKET_ORDER.filter((b) => map.has(b)).map((b) => ({ bucket: b, items: map.get(b)! }));
  }, [items, query, meeting, now]);

  if (error) return <ErrorCard message={error} />;
  if (!items) return <ListSkeleton />;
  if (items.length === 0) {
    return (
      <EmptyCard
        icon={<BookmarkFilledIcon className="h-5 w-5 nf-tm" />}
        title="No highlights yet"
        body="Highlights are the key moments NoteFlow detects in your captured conversations. Record or open a meeting and they’ll collect here — each linked to the exact spot in the recording."
      />
    );
  }

  return (
    <div>
      <ListToolbar query={query} onQuery={setQuery} meeting={meeting} onMeeting={setMeeting} options={meetingOptions} placeholder="Search highlights…" />

      {groups.length === 0 ? (
        <ListNoResults onClear={() => { setQuery(""); setMeeting("all"); }} />
      ) : (
        <div className="mt-6 flex flex-col gap-9">
          {groups.map(({ bucket, items }) => (
            <section key={bucket}>
              <h2 className="mb-3 px-2 text-[11px] font-medium uppercase tracking-[0.16em] nf-tm">{bucket}</h2>
              <ul className="flex flex-col">
                {items.map((h, i) => {
                  const date = shortDate(h.meeting_date);
                  return (
                    <li key={`${h.meeting_id}-${i}`}>
                      {i > 0 && <div className="mx-2 border-t" style={{ borderColor: "var(--nf-hairline)" }} />}
                      <Link href={`/app/meetings/${h.meeting_id}`} className="nf-row group flex items-start gap-5 rounded-lg px-3 py-5">
                        <span className="w-12 shrink-0 pt-0.5 text-right font-mono text-sm tabular-nums nf-t2">
                          {h.start != null ? formatTimestamp(h.start) : ""}
                        </span>
                        <div className="relative min-w-0 max-w-[56ch] pl-4">
                          <span className="absolute bottom-0.5 left-0 top-0.5 w-px transition-colors group-hover:bg-[var(--nf-border-strong)]" style={{ background: "var(--nf-border)" }} aria-hidden="true" />
                          <p className="text-[15.5px] leading-[1.6] nf-t" dir="auto">{h.title}</p>
                          <p className="mt-2 truncate text-xs nf-tm">
                            {h.meeting_title}{date ? ` · ${date}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 self-center pt-0.5">
                          <MiniWave seed={h.segment_id ?? h.meeting_id} className="hidden opacity-45 transition-opacity group-hover:opacity-90 md:flex" />
                          <span className="grid h-8 w-8 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100" style={{ background: "var(--nf-surface-3)", border: "1px solid var(--nf-border)" }} aria-hidden="true">
                            <PlayIcon className="h-3.5 w-3.5 nf-t" />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
