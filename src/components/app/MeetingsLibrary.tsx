"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type MeetingDTO } from "@/lib/api";
import { statusKind, type StatusKind } from "@/lib/meetingStatus";
import { formatDuration } from "@/lib/format";
import { useMeetingsRealtime } from "@/components/app/RealtimeProvider";
import { ConnectionBadge } from "@/components/app/ConnectionBadge";
import { MeetingWaveThumb } from "@/components/app/MeetingWaveThumb";
import { MeetingStatus } from "@/components/app/MeetingStatus";
import { RecordMeetingButton } from "@/components/app/RecordMeetingButton";
import { SearchIcon, PlayIcon, ChevronDownIcon, MicIcon } from "@/components/icons";

/* ------------------------------------------------------------------ helpers */

const TIME_FMT = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const WEEKDAY_FMT = new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
const DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function providerLabel(p: string | null): string | null {
  if (!p) return null;
  const k = p.toLowerCase();
  if (k.includes("meet")) return "Google Meet";
  if (k.includes("zoom")) return "Zoom";
  if (k.includes("team")) return "Microsoft Teams";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

type Bucket = "Today" | "Yesterday" | "This week" | "Earlier";
const BUCKET_ORDER: Bucket[] = ["Today", "Yesterday", "This week", "Earlier"];

function meetingDate(m: MeetingDTO): Date {
  return new Date(m.started_at ?? m.created_at);
}

function bucketOf(d: Date, now: Date): Bucket {
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startToday - startD) / 86_400_000);
  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return "This week";
  return "Earlier";
}

function rowTimeLabel(d: Date, bucket: Bucket): string {
  if (bucket === "Today" || bucket === "Yesterday") return TIME_FMT.format(d);
  if (bucket === "This week") return WEEKDAY_FMT.format(d);
  return DATE_FMT.format(d);
}

const IN_PROGRESS = new Set(["joining", "in_waiting_room", "recording"]);

type StatusFilter = "all" | StatusKind;
type DateFilter = "all" | "today" | "week" | "month";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "processing", label: "Processing" },
  { key: "ready", label: "Ready" },
  { key: "failed", label: "Failed" },
];

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; meetings: MeetingDTO[] };

/* --------------------------------------------------------------- component */

export function MeetingsLibrary() {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const { status: rtStatus, connectionEpoch, onMeetingChange } = useMeetingsRealtime();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const meetings = await apiFetch<MeetingDTO[]>("/api/v1/meetings");
      setState({ phase: "ready", meetings });
    } catch (e) {
      setState({
        phase: "error",
        message: e instanceof ApiError ? e.message : "Couldn’t load your meetings.",
      });
    }
  }, []);

  // Same real fetch + realtime discipline as the rest of the app.
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (connectionEpoch > 0) void load(); }, [connectionEpoch, load]);
  useEffect(() => {
    const unsub = onMeetingChange(() => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => void load(), 300);
    });
    return () => { if (debounce.current) clearTimeout(debounce.current); unsub(); };
  }, [onMeetingChange, load]);
  useEffect(() => {
    if (rtStatus === "connected") return;
    const t = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 10_000);
    return () => clearInterval(t);
  }, [rtStatus, load]);

  const all = state.phase === "ready" ? state.meetings : [];

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: all.length, live: 0, processing: 0, ready: 0, failed: 0 };
    for (const m of all) c[statusKind(m.status)]++;
    return c;
  }, [all]);

  const now = useMemo(() => new Date(), [state]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((m) => {
      if (statusFilter !== "all" && statusKind(m.status) !== statusFilter) return false;
      if (q) {
        const hay = `${m.title ?? "Untitled meeting"} ${providerLabel(m.provider) ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dateFilter !== "all") {
        const b = bucketOf(meetingDate(m), now);
        if (dateFilter === "today" && b !== "Today") return false;
        if (dateFilter === "week" && (b === "Earlier")) return false;
        if (dateFilter === "month") {
          const d = meetingDate(m);
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        }
      }
      return true;
    });
  }, [all, query, statusFilter, dateFilter, now]);

  const groups = useMemo(() => {
    const map = new Map<Bucket, MeetingDTO[]>();
    for (const m of filtered) {
      const b = bucketOf(meetingDate(m), now);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(m);
    }
    for (const list of map.values()) list.sort((a, b) => meetingDate(b).getTime() - meetingDate(a).getTime());
    return BUCKET_ORDER.filter((b) => map.has(b)).map((b) => ({ bucket: b, items: map.get(b)! }));
  }, [filtered, now]);

  const isFiltering = query.trim() !== "" || statusFilter !== "all" || dateFilter !== "all";
  const clearFilters = () => { setQuery(""); setStatusFilter("all"); setDateFilter("all"); };

  return (
    <div>
      <Toolbar
        query={query}
        onQuery={setQuery}
        statusFilter={statusFilter}
        onStatus={setStatusFilter}
        counts={counts}
        dateFilter={dateFilter}
        onDate={setDateFilter}
      />

      <div className="mt-6 max-w-[1080px]">
        {state.phase === "loading" && <LibrarySkeleton />}

        {state.phase === "error" && (
          <div className="nf-card px-6 py-10 text-center">
            <p className="text-sm font-medium nf-t">Couldn’t load your meetings</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm nf-tm">{state.message}</p>
            <button type="button" onClick={() => { setState({ phase: "loading" }); void load(); }} className="nf-btn-secondary mt-5 px-4 py-2 text-sm">
              Try again
            </button>
          </div>
        )}

        {state.phase === "ready" && all.length === 0 && <TrueEmpty />}

        {state.phase === "ready" && all.length > 0 && groups.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm nf-t2">No conversations match this search.</p>
            <button type="button" onClick={clearFilters} className="mt-3 text-sm underline underline-offset-4 nf-t2 transition-colors hover:text-[color:var(--nf-text)]">
              Clear filters
            </button>
          </div>
        )}

        {state.phase === "ready" && groups.length > 0 && (
          <div className="flex flex-col gap-10">
            {groups.map(({ bucket, items }) => (
              <section key={bucket}>
                <h2 className="mb-3 px-3 text-[11px] font-medium uppercase tracking-[0.16em] nf-tm">{bucket}</h2>
                <ul className="flex flex-col">
                  {items.map((m, i) => (
                    <li key={m.id}>
                      {i > 0 && <div className="mx-3 border-t" style={{ borderColor: "var(--nf-hairline)" }} />}
                      <MeetingRow meeting={m} bucket={bucket} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {state.phase === "ready" && (
        <div className="mt-6 flex justify-end">
          <ConnectionBadge />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ toolbar */

function Toolbar({
  query,
  onQuery,
  statusFilter,
  onStatus,
  counts,
  dateFilter,
  onDate,
}: {
  query: string;
  onQuery: (v: string) => void;
  statusFilter: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
  dateFilter: DateFilter;
  onDate: (v: DateFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="nf-input flex min-w-0 flex-1 items-center gap-2.5 px-4 py-2.5">
        <SearchIcon className="h-4 w-4 shrink-0 nf-tm" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search conversations…"
          aria-label="Search conversations"
          className="w-full bg-transparent text-sm nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2 overflow-x-auto lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className="flex shrink-0 items-center gap-0.5 rounded-full p-1"
          style={{ background: "var(--nf-surface-1)", border: "1px solid var(--nf-border)" }}
          role="tablist"
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            const n = counts[f.key];
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onStatus(f.key)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] transition-colors ${
                  active ? "nf-t" : "nf-tm hover:text-[color:var(--nf-text)]"
                }`}
                style={active ? { background: "var(--nf-surface-3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" } : undefined}
              >
                {f.label}
                <span className="tabular-nums nf-tf">{n}</span>
              </button>
            );
          })}
        </div>
        <DateDropdown value={dateFilter} onChange={onDate} />
      </div>
    </div>
  );
}

function DateDropdown({ value, onChange }: { value: DateFilter; onChange: (v: DateFilter) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onEsc); };
  }, []);
  const label = DATE_FILTERS.find((d) => d.key === value)?.label ?? "All time";
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] nf-t2 transition-colors hover:text-[color:var(--nf-text)]"
        style={{ background: "var(--nf-surface-1)", border: "1px solid var(--nf-border)" }}
      >
        {label}
        <ChevronDownIcon className="h-3.5 w-3.5 nf-tf" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-30 w-40 overflow-hidden rounded-xl border shadow-xl shadow-black/50"
          style={{ background: "var(--nf-surface-2)", borderColor: "var(--nf-border)" }}
        >
          {DATE_FILTERS.map((d) => (
            <button
              key={d.key}
              type="button"
              role="menuitemradio"
              aria-checked={value === d.key}
              onClick={() => { onChange(d.key); setOpen(false); }}
              className={`block w-full px-4 py-2 text-left text-[13px] transition-colors hover:bg-[var(--nf-surface-hover)] ${value === d.key ? "nf-t" : "nf-t2"}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- row */

function MeetingRow({ meeting, bucket }: { meeting: MeetingDTO; bucket: Bucket }) {
  const live = IN_PROGRESS.has(meeting.status);
  const time = rowTimeLabel(meetingDate(meeting), bucket);
  const provider = providerLabel(meeting.provider);
  const duration = meeting.duration_seconds != null ? formatDuration(meeting.duration_seconds) : null;
  const meta = [time, provider, duration].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/app/meetings/${meeting.id}`}
      className="nf-row group flex items-center gap-4 rounded-xl px-3 py-3.5"
      style={live ? { background: "rgba(255,255,255,0.025)" } : undefined}
    >
      <MeetingWaveThumb
        seed={meeting.id}
        className="h-12 w-[76px] brightness-[0.88] transition duration-200 group-hover:brightness-110"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.95rem] font-medium nf-t">{meeting.title || "Untitled meeting"}</p>
        <p className="mt-1 truncate text-[12px] nf-t2">{meta}</p>
      </div>
      <div className="hidden shrink-0 transition-opacity group-hover:opacity-0 sm:block">
        <MeetingStatus status={meeting.status} />
      </div>
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "var(--nf-surface-3)", border: "1px solid var(--nf-border)" }}
        aria-hidden="true"
      >
        <PlayIcon className="h-3.5 w-3.5 nf-t" />
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------- states */

function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1 h-3 w-16 rounded" style={{ background: "var(--nf-surface-3)" }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-3.5">
          <div className="h-12 w-[76px] shrink-0 rounded-lg" style={{ background: "var(--nf-surface-3)" }} />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-1/3 rounded" style={{ background: "var(--nf-surface-3)" }} />
            <div className="mt-2 h-3 w-1/4 rounded" style={{ background: "var(--nf-surface-2)" }} />
          </div>
          <div className="h-3 w-20 rounded" style={{ background: "var(--nf-surface-2)" }} />
        </div>
      ))}
    </div>
  );
}

function TrueEmpty() {
  return (
    <div className="nf-card px-6 py-16 text-center">
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--nf-surface-2)", border: "1px solid var(--nf-border)" }}>
        <MicIcon className="h-5 w-5 nf-tm" />
      </div>
      <p className="text-base font-medium nf-t">No meetings yet</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed nf-tm">
        Capture your first Meet, Zoom, or Teams call. NoteFlow will turn it into a transcript,
        summary, actions, and a searchable conversation.
      </p>
      <div className="mt-6 flex justify-center">
        <RecordMeetingButton label="Capture a meeting" className="nf-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm" />
      </div>
    </div>
  );
}
