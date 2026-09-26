"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type MeetingDTO, type TranscriptDTO } from "@/lib/api";
import { statusKind, statusLabel } from "@/lib/meetingStatus";
import { formatDuration, formatTimestamp } from "@/lib/format";
import { MeetingInsights } from "@/components/app/MeetingInsights";
import { MeetingAsk } from "@/components/app/MeetingAsk";
import { RecordingPlayer, type RecordingPlayerHandle } from "@/components/app/RecordingPlayer";
import { ShareControl } from "@/components/app/ShareControl";
import { MeetingStatus } from "@/components/app/MeetingStatus";
import { ConnectionBadge } from "@/components/app/ConnectionBadge";
import { useMeetingsRealtime } from "@/components/app/RealtimeProvider";
import { SearchIcon, ChevronUpIcon, ChevronDownIcon } from "@/components/icons";

type Segment = TranscriptDTO["segments"][number];

const HEADER_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function providerLabel(p: string | null): string | null {
  if (!p) return null;
  const k = p.toLowerCase();
  if (k.includes("meet")) return "Google Meet";
  if (k.includes("zoom")) return "Zoom";
  if (k.includes("team")) return "Microsoft Teams";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function BackArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

/**
 * The NoteFlow meeting workspace (Phase 3) — a two-pane conversation-intelligence workbench.
 * Left = what matters (summary / decisions / actions / important moments), right = what was said
 * (the transcript, searchable), a persistent thin player connects both via the real seekTo, and
 * Ask interrogates the meeting from the bottom. All existing behavior/endpoints/states preserved;
 * partial availability is handled gracefully (recording can play while transcript still processes).
 */
export function RealMeetingWorkspace({ meetingId }: { meetingId: string }) {
  const [meeting, setMeeting] = useState<MeetingDTO | null>(null);
  const [transcript, setTranscript] = useState<TranscriptDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pane, setPane] = useState<"intel" | "convo">("convo"); // mobile switch
  const { status: rtStatus, connectionEpoch, onMeetingChange } = useMeetingsRealtime();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<RecordingPlayerHandle>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const load = useCallback(async () => {
    try {
      const m = await apiFetch<MeetingDTO>(`/api/v1/meetings/${meetingId}`);
      const t = await apiFetch<TranscriptDTO>(`/api/v1/meetings/${meetingId}/transcript`);
      setMeeting(m);
      setTranscript(t);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load this meeting.");
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

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
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 10_000);
    return () => clearInterval(timer);
  }, [rtStatus, load]);

  const seek = useCallback((seconds: number) => playerRef.current?.seekTo(seconds), []);

  if (loading) return <WorkspaceSkeleton />;

  if (error || !meeting) {
    return (
      <main className="mx-auto w-full max-w-reading px-5 py-16 text-center">
        <p className="text-base font-medium nf-t">Couldn’t open this meeting</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm nf-tm">{error ?? "It may not exist, or you may not have access."}</p>
        <Link href="/app/meetings" className="nf-btn-secondary mt-6 inline-flex px-4 py-2 text-sm">Back to Meetings</Link>
      </main>
    );
  }

  const kind = statusKind(meeting.status);
  const segments = transcript?.segments ?? [];
  const hasTranscript = segments.length > 0;
  const when = meeting.started_at ?? meeting.created_at;
  const provider = providerLabel(meeting.provider);
  const failed = kind === "failed";

  return (
    <main className="relative flex h-[calc(100vh-4rem)] min-w-0 flex-1 flex-col overflow-hidden">
      {/* Restrained NoteFlow atmosphere around the header/player only — fades well before the panes. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden h-[240px] overflow-hidden md:block">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/assets/Wave-texture.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            filter: "grayscale(1) brightness(1.25) contrast(1.05)",
            opacity: 0.07,
            WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 26%, transparent 76%)",
            maskImage: "linear-gradient(to bottom, #000 0%, #000 26%, transparent 76%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 shrink-0 px-5 pb-4 pt-4 sm:px-8">
        <Link href="/app/meetings" className="nf-btn-ghost -ml-1 inline-flex items-center gap-1 rounded-lg py-1 pl-1 pr-2 text-[13px]">
          <BackArrow className="h-4 w-4" /> Meetings
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="truncate text-xl font-medium tracking-[-0.015em] nf-t sm:text-2xl">
                {meeting.title || "Untitled meeting"}
              </h1>
              <MeetingStatus status={meeting.status} />
            </div>
            <p className="mt-1.5 text-[13px] nf-t2">
              {[HEADER_DATE.format(new Date(when)), meeting.duration_seconds != null ? formatDuration(meeting.duration_seconds) : null, provider].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ConnectionBadge />
            <ShareControl meetingId={meeting.id} initialShareId={meeting.share_id} />
          </div>
        </div>
      </header>

      {failed ? (
        <div className="flex flex-1 items-center justify-center px-5 py-16 text-center">
          <div>
            <p className="text-base font-medium nf-t">Processing failed</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm nf-tm">NoteFlow couldn’t finish processing this meeting. The recording may still be safe — you can try capturing again.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Persistent signature player */}
          <div className="relative z-10 shrink-0 px-5 pb-4 sm:px-8">
            <RecordingPlayer ref={playerRef} meetingId={meeting.id} onTime={setCurrentTime} />
          </div>

          {/* Mobile pane switch */}
          <div className="shrink-0 border-t px-5 py-2 lg:hidden" style={{ borderColor: "var(--nf-hairline)" }}>
            <div className="inline-flex rounded-full p-0.5" style={{ background: "var(--nf-surface-1)", border: "1px solid var(--nf-border)" }}>
              {(["intel", "convo"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPane(p)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${pane === p ? "nf-t" : "nf-tm"}`}
                  style={pane === p ? { background: "var(--nf-surface-3)" } : undefined}
                >
                  {p === "intel" ? "Intelligence" : "Conversation"}
                </button>
              ))}
            </div>
          </div>

          {/* Two-pane workbench */}
          <div className="flex min-h-0 flex-1 border-t" style={{ borderColor: "var(--nf-hairline)" }}>
            {/* Intelligence — a document/editorial surface */}
            <section className={`min-h-0 w-full overflow-y-auto px-6 py-7 sm:px-8 lg:block lg:w-[46%] ${pane === "intel" ? "block" : "hidden"}`}>
              <h2 className="mb-7 text-[11px] font-medium uppercase tracking-[0.16em] nf-tf">Meeting intelligence</h2>
              {hasTranscript ? (
                <MeetingInsights meetingId={meeting.id} segments={segments} onSeek={seek} />
              ) : (
                <p className="text-sm nf-tm">{kind === "live" ? "Insights appear here once the call ends and the transcript is ready." : "Generating insights from the transcript…"}</p>
              )}
            </section>

            <div className="hidden w-px shrink-0 lg:block" style={{ background: "var(--nf-hairline)" }} />

            {/* Conversation — a temporal stream */}
            <section className={`min-h-0 w-full overflow-y-auto lg:block lg:w-[54%] ${pane === "convo" ? "block" : "hidden"}`}>
              <Conversation segments={segments} currentTime={currentTime} onSeek={seek} kind={kind} status={meeting.status} />
            </section>
          </div>

          {/* Persistent Ask */}
          {hasTranscript && (
            <div className="shrink-0 border-t px-5 py-3 sm:px-8" style={{ borderColor: "var(--nf-hairline)" }}>
              <MeetingAsk meetingId={meeting.id} segments={segments} onSeek={seek} />
            </div>
          )}
        </>
      )}
    </main>
  );
}

/* ------------------------------------------------------------- conversation */

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const out: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) { out.push(text.slice(i)); break; }
    if (idx > i) out.push(text.slice(i, idx));
    out.push(
      <mark key={k++} style={{ background: "rgba(255,255,255,0.16)", color: "var(--nf-text)", borderRadius: 3, padding: "0 1px" }}>
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    i = idx + q.length;
  }
  return out;
}

function Conversation({
  segments,
  currentTime,
  onSeek,
  kind,
  status,
}: {
  segments: Segment[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  kind: ReturnType<typeof statusKind>;
  status: string;
}) {
  const [query, setQuery] = useState("");
  const [matchIdx, setMatchIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeId = useMemo(
    () => segments.find((s) => s.start <= currentTime && currentTime < s.end)?.id ?? null,
    [segments, currentTime],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return segments.filter((s) => s.text.toLowerCase().includes(q)).map((s) => s.id);
  }, [segments, query]);

  useEffect(() => { setMatchIdx(0); }, [query]);

  const onManualScroll = () => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { pausedRef.current = false; }, 5000);
  };

  // Auto-scroll to the active (playing) segment unless the user just scrolled or is searching.
  useEffect(() => {
    if (!activeId || pausedRef.current || query) return;
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId, query]);

  useEffect(() => () => { if (resumeTimer.current) clearTimeout(resumeTimer.current); }, []);

  const gotoMatch = (next: number) => {
    if (matches.length === 0) return;
    const idx = (next + matches.length) % matches.length;
    setMatchIdx(idx);
    const el = scrollRef.current?.querySelector(`[data-seg="${matches[idx]}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const currentMatchId = matches[matchIdx] ?? null;

  return (
    <div ref={scrollRef} className="flex h-full flex-col">
      {/* Conversation header + transcript search */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3 sm:px-6" style={{ background: "var(--nf-bg)", borderBottom: "1px solid var(--nf-hairline)" }}>
        <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] nf-tf">Conversation</h2>
        {segments.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <div className="nf-input flex items-center gap-2 px-3 py-1.5">
              <SearchIcon className="h-3.5 w-3.5 shrink-0 nf-tm" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") gotoMatch(matchIdx + (e.shiftKey ? -1 : 1)); }}
                placeholder="Search transcript…"
                aria-label="Search transcript"
                className="w-32 bg-transparent text-[13px] nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none sm:w-44"
              />
            </div>
            {query && (
              <div className="flex items-center gap-1 text-xs nf-tm">
                <span className="tabular-nums">{matches.length ? `${matchIdx + 1}/${matches.length}` : "0"}</span>
                <button type="button" aria-label="Previous match" disabled={!matches.length} onClick={() => gotoMatch(matchIdx - 1)} className="nf-btn-ghost grid h-6 w-6 place-items-center rounded-md disabled:opacity-40">
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Next match" disabled={!matches.length} onClick={() => gotoMatch(matchIdx + 1)} className="nf-btn-ghost grid h-6 w-6 place-items-center rounded-md disabled:opacity-40">
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 px-5 py-5 sm:px-6" onWheel={onManualScroll} onTouchMove={onManualScroll}>
        {segments.length === 0 ? (
          <p className="text-sm nf-tm">
            {kind === "live"
              ? `${statusLabel(status)}. The transcript appears here automatically once the call ends and processing finishes.`
              : kind === "processing"
                ? "Transcribing the recording… this updates on its own."
                : "No transcript was produced for this meeting."}
          </p>
        ) : (
          <ol className="space-y-7">
            {segments.map((seg) => {
              const isActive = seg.id === activeId;
              const isMatch = seg.id === currentMatchId;
              const name = (seg.speaker || "Speaker").toUpperCase();
              return (
                <li
                  key={seg.id}
                  data-seg={seg.id}
                  ref={isActive ? activeRef : null}
                  onClick={() => onSeek(seg.start)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSeek(seg.start); }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Play from ${formatTimestamp(seg.start)}, ${name}`}
                  className="nf-row cursor-pointer rounded-md py-1.5 pl-3.5 pr-2 transition-colors"
                  style={{
                    borderLeft: isActive ? "2px solid var(--nf-text-secondary)" : "2px solid transparent",
                    background: isActive ? "rgba(255,255,255,0.03)" : undefined,
                  }}
                >
                  <div className="flex items-baseline gap-2.5">
                    <span
                      className="shrink-0 font-mono text-[11px] tabular-nums"
                      style={{ color: isActive ? "var(--nf-text-secondary)" : "var(--nf-text-muted)" }}
                    >
                      {formatTimestamp(seg.start)}
                    </span>
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] nf-t2">{name}</span>
                  </div>
                  <p
                    dir="auto"
                    className={`mt-1.5 max-w-[64ch] text-[14.5px] leading-[1.72] ${isMatch ? "rounded px-1" : ""}`}
                    style={{
                      color: isActive ? "var(--nf-text)" : "var(--nf-text-secondary)",
                      background: isMatch ? "rgba(255,255,255,0.05)" : undefined,
                    }}
                  >
                    {highlight(seg.text, query.trim())}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <main className="flex h-[calc(100vh-4rem)] min-w-0 flex-1 flex-col overflow-hidden">
      <div className="px-5 py-3.5 sm:px-8">
        <div className="h-4 w-24 rounded" style={{ background: "var(--nf-surface-3)" }} />
        <div className="mt-3 h-6 w-1/2 max-w-md rounded" style={{ background: "var(--nf-surface-3)" }} />
        <div className="mt-2 h-3 w-40 rounded" style={{ background: "var(--nf-surface-2)" }} />
      </div>
      <div className="border-t px-5 py-3 sm:px-8" style={{ borderColor: "var(--nf-hairline)" }}>
        <div className="h-9 w-full rounded-full" style={{ background: "var(--nf-surface-2)" }} />
      </div>
      <div className="flex min-h-0 flex-1 border-t" style={{ borderColor: "var(--nf-hairline)" }}>
        <div className="w-[44%] space-y-3 px-6 py-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 rounded" style={{ width: `${90 - i * 12}%`, background: "var(--nf-surface-2)" }} />
          ))}
        </div>
        <div className="w-px" style={{ background: "var(--nf-hairline)" }} />
        <div className="flex-1 space-y-5 px-6 py-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 rounded" style={{ background: "var(--nf-surface-2)" }} />
              <div className="mt-2 h-4 w-3/4 rounded" style={{ background: "var(--nf-surface-2)" }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
