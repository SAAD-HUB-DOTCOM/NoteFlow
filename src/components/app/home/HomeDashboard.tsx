"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  apiFetch,
  ApiError,
  type MeetingDTO,
  type ActionItemDTO,
  type AskAllDTO,
} from "@/lib/api";
import { statusKind } from "@/lib/meetingStatus";
import { formatDuration, formatTimestamp, relativeMeetingTime } from "@/lib/format";
import { useMeetingsRealtime } from "@/components/app/RealtimeProvider";
import { ConversationThumb } from "@/components/app/ConversationThumb";
import { RecordMeetingButton } from "@/components/app/RecordMeetingButton";
import { Skeleton } from "@/components/Skeleton";
import {
  CalendarIcon,
  ClockIcon,
  PlayIcon,
  ChevronRightIcon,
  SparkleIcon,
  MicIcon,
} from "@/components/icons";

/* ------------------------------------------------------------------ helpers */

const TIME_FMT = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function providerLabel(p: string | null): string | null {
  if (!p) return null;
  const k = p.toLowerCase();
  if (k.includes("meet")) return "Google Meet";
  if (k.includes("zoom")) return "Zoom";
  if (k.includes("team")) return "Microsoft Teams";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

/** "Summary ready" / "Processing" / "Recording" / "Failed" — the human status for a row. */
function statusText(status: string): string {
  const kind = statusKind(status);
  if (kind === "ready") return "Summary ready";
  if (kind === "processing") return "Processing";
  if (kind === "failed") return "Failed";
  if (status === "recording") return "Recording";
  if (status === "joining" || status === "in_waiting_room") return "Joining";
  return "Scheduled";
}

function untilLabel(startedAt: string): string {
  const diff = new Date(startedAt).getTime() - Date.now();
  const min = Math.round(diff / 60000);
  if (min <= 0) return "Now";
  if (min < 60) return `In ${min} min`;
  const hr = Math.round(min / 60);
  return `In ${hr} hr`;
}

function meetingTime(m: MeetingDTO): string | null {
  if (!m.started_at) return null;
  const start = new Date(m.started_at);
  if (m.duration_seconds) {
    const end = new Date(start.getTime() + m.duration_seconds * 1000);
    return `${TIME_FMT.format(start)} – ${TIME_FMT.format(end)}`;
  }
  return TIME_FMT.format(start);
}

const IN_PROGRESS = new Set(["joining", "in_waiting_room", "recording"]);
const SCHEDULED = new Set(["scheduled", "bot_scheduled"]);

type Data = { meetings: MeetingDTO[]; actionItems: ActionItemDTO[] };
type State = { phase: "loading" } | { phase: "error"; message: string } | { phase: "ready"; data: Data };

/* --------------------------------------------------------------- dashboard */

export function HomeDashboard() {
  const [state, setState] = useState<State>({ phase: "loading" });
  const { status: rtStatus, connectionEpoch, onMeetingChange } = useMeetingsRealtime();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const [meetings, actionItems] = await Promise.all([
        apiFetch<MeetingDTO[]>("/api/v1/meetings"),
        apiFetch<ActionItemDTO[]>("/api/v1/action-items").catch(() => [] as ActionItemDTO[]),
      ]);
      setState({ phase: "ready", data: { meetings, actionItems } });
    } catch (e) {
      setState({
        phase: "error",
        message: e instanceof ApiError ? e.message : "Couldn’t load your dashboard.",
      });
    }
  }, []);

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

  if (state.phase === "loading") return <DashboardSkeleton />;

  if (state.phase === "error") {
    return (
      <div className="mt-8 nf-card p-6">
        <p className="text-sm font-medium nf-t">Couldn’t load your dashboard</p>
        <p className="mt-1.5 text-sm nf-tm">{state.message}</p>
      </div>
    );
  }

  const { meetings, actionItems } = state.data;
  const live = meetings.find((m) => IN_PROGRESS.has(m.status));
  const upcoming = meetings
    .filter((m) => SCHEDULED.has(m.status) && m.started_at && new Date(m.started_at).getTime() > Date.now())
    .sort((a, b) => new Date(a.started_at!).getTime() - new Date(b.started_at!).getTime())[0];
  const next = live ?? upcoming ?? null;
  const recent = meetings
    .filter((m) => m.id !== next?.id)
    .sort(
      (a, b) =>
        new Date(b.started_at ?? b.created_at).getTime() -
        new Date(a.started_at ?? a.created_at).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_336px]">
      <div className="flex min-w-0 flex-col gap-8">
        <NextMeeting meeting={next} isLive={!!live} />
        <RecentConversations meetings={recent} empty={meetings.length === 0} />
        <HomeAsk hasMeetings={meetings.length > 0} />
      </div>
      <div className="flex min-w-0 flex-col gap-8">
        <TodayRail />
        <ActionItemsPreview items={actionItems} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- next meeting */

function NextMeeting({ meeting, isLive }: { meeting: MeetingDTO | null; isLive: boolean }) {
  if (!meeting) {
    return (
      <section className="nf-card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] nf-tf">Next meeting</p>
          <p className="mt-2 text-lg font-medium nf-t">No meeting scheduled</p>
          <p className="mt-1 text-sm nf-tm">Paste a Meet, Zoom, or Teams link and NoteFlow will join and capture it.</p>
        </div>
        <RecordMeetingButton label="Capture a meeting" className="nf-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm" />
      </section>
    );
  }

  const provider = providerLabel(meeting.provider);
  const time = meetingTime(meeting);
  const title = meeting.title || "Untitled meeting";

  return (
    <section className="nf-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-xl"
          style={{ background: "var(--nf-surface-3)", border: "1px solid var(--nf-border)" }}
        >
          <CalendarIcon className="h-6 w-6 nf-t2" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] nf-tf">
              {isLive ? "Active capture" : "Next meeting"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs nf-t2">
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse" : ""}`} style={{ background: isLive ? "var(--nf-failed)" : "var(--nf-text-secondary)" }} />
              {isLive ? "Recording now" : meeting.started_at ? untilLabel(meeting.started_at) : "Scheduled"}
            </span>
          </div>
          <h2 className="mt-1 truncate text-xl font-medium nf-t">{title}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm nf-tm">
            {time && (
              <span className="inline-flex items-center gap-1.5"><ClockIcon className="h-4 w-4" />{time}</span>
            )}
            {provider && <span>{provider}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isLive ? (
            <Link href={`/app/meetings/${meeting.id}`} className="nf-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm">
              Open meeting
            </Link>
          ) : (
            <>
              {meeting.meeting_url && (
                <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer" className="nf-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm">
                  <MicIcon className="h-4 w-4" /> Join &amp; capture
                </a>
              )}
              <Link href={`/app/meetings/${meeting.id}`} className="nf-btn-secondary inline-flex items-center px-4 py-2.5 text-sm">
                View details
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- recent conversations */

function RecentConversations({ meetings, empty }: { meetings: MeetingDTO[]; empty: boolean }) {
  const now = new Date();
  return (
    <section>
      <SectionHeading title="Recent conversations" href={empty ? undefined : "/app/meetings"} />
      {empty ? (
        <div className="nf-card px-6 py-12 text-center">
          <p className="text-sm font-medium nf-t">No meetings yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm nf-tm">
            Capture your first Meet, Zoom, or Teams call. NoteFlow turns it into a transcript, summary, and searchable conversation.
          </p>
          <div className="mt-5 flex justify-center">
            <RecordMeetingButton label="Capture a meeting" className="nf-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm" />
          </div>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col">
          {meetings.map((m, i) => {
            const rel = relativeMeetingTime(m.started_at ?? m.created_at, now);
            const when = rel.group === "Today" ? `Today, ${rel.label}` : rel.label;
            return (
              <li key={m.id}>
                {i > 0 && <div className="border-t" style={{ borderColor: "var(--nf-hairline)" }} />}
                <Link href={`/app/meetings/${m.id}`} className="nf-row group flex items-center gap-4 rounded-xl px-3 py-3">
                  <ConversationThumb seed={m.id} className="h-11 w-16" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.95rem] font-medium nf-t">{m.title || "Untitled meeting"}</p>
                    <p className="mt-0.5 truncate text-xs nf-tm">
                      {when}
                      {m.duration_seconds != null && ` · ${formatDuration(m.duration_seconds)}`}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-xs nf-t2 sm:inline">{statusText(m.status)}</span>
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: "var(--nf-surface-3)", border: "1px solid var(--nf-border)" }}
                  >
                    <PlayIcon className="h-3.5 w-3.5 nf-t" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ----------------------------------------------------------------- today rail */

function TodayRail() {
  // No calendar integration exists yet — honest coming-state instead of fabricated times.
  return (
    <section>
      <SectionHeading title="Today" />
      <div className="nf-card px-5 py-6">
        <p className="text-sm nf-t2">No calendar connected</p>
        <p className="mt-1.5 text-sm leading-relaxed nf-tm">
          Connect a calendar to see your schedule beside your meetings. Until then, capture any call by pasting its link.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- action items preview */

function ActionItemsPreview({ items }: { items: ActionItemDTO[] }) {
  const shown = items.slice(0, 5);
  return (
    <section>
      <SectionHeading title="Action items" href={items.length ? "/app/action-items" : undefined} />
      {shown.length === 0 ? (
        <div className="nf-card px-5 py-6">
          <p className="text-sm nf-t2">No action items yet</p>
          <p className="mt-1.5 text-sm nf-tm">Follow-ups NoteFlow hears in your meetings will collect here.</p>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col">
          {shown.map((a, i) => (
            <li key={`${a.meeting_id}-${i}`}>
              {i > 0 && <div className="border-t" style={{ borderColor: "var(--nf-hairline)" }} />}
              <Link href={`/app/meetings/${a.meeting_id}`} className="nf-row flex items-start gap-3 rounded-xl px-3 py-3">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full" style={{ border: "1.5px solid var(--nf-border-strong)" }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm nf-t">{a.text}</span>
                  <span className="mt-0.5 block truncate text-xs nf-tm">
                    {a.owner ? `${a.owner} · ` : ""}{a.meeting_title}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------- home ask */

function HomeAsk({ hasMeetings }: { hasMeetings: boolean }) {
  const PROMPTS = [
    "What did we decide about pricing?",
    "What's still open across my meetings?",
    "What did I commit to this week?",
  ];
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AskAllDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (raw: string) => {
    const question = raw.trim();
    if (!question || loading) return;
    setLoading(true); setError(null); setAnswer(null); setAsked(question);
    try {
      const res = await apiFetch<AskAllDTO>("/api/v1/ask", { method: "POST", body: JSON.stringify({ question }) });
      setAnswer(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t get an answer. Try again.");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return (
    <section className="nf-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <SparkleIcon className="h-4 w-4 nf-t2" />
        <h2 className="text-[15px] font-medium nf-t">Ask NoteFlow</h2>
      </div>
      <p className="mt-1.5 text-sm nf-tm">
        {hasMeetings
          ? "Ask anything you've discussed. Answers link back to the exact moment."
          : "Once you've recorded a meeting, ask it anything and get answers with the exact moment they were said."}
      </p>

      <div className="nf-input mt-4 flex items-center gap-2.5 px-3.5 py-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void submit(q); } }}
          disabled={!hasMeetings}
          placeholder={hasMeetings ? "Ask anything you've discussed…" : "Record a meeting to start asking"}
          aria-label="Ask NoteFlow"
          className="w-full bg-transparent text-sm nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={() => void submit(q)}
          disabled={!hasMeetings || loading || !q.trim()}
          className="nf-btn-secondary shrink-0 px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </div>

      {hasMeetings && !asked && (
        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => void submit(p)}
              className="rounded-full px-3 py-1.5 text-xs nf-t2 transition-colors hover:text-[color:var(--nf-text)]"
              style={{ border: "1px solid var(--nf-border)" }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {asked && (
        <div className="mt-4 rounded-xl p-3.5" style={{ background: "var(--nf-surface-2)", border: "1px solid var(--nf-hairline)" }}>
          {loading && <p className="flex items-center gap-2 text-sm nf-t2"><SparkleIcon className="h-4 w-4 animate-pulse" />Reading your meetings…</p>}
          {error && !loading && <p className="text-sm" style={{ color: "var(--nf-failed)" }}>{error}</p>}
          {answer && !loading && (
            <>
              <p className="text-sm leading-relaxed nf-t">{answer.answer}</p>
              {answer.citations.length > 0 && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {answer.citations.map((c) => (
                    <Link key={c.segment_id} href={`/app/meetings/${c.meeting_id}`} className="nf-row flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs" style={{ border: "1px solid var(--nf-border)" }}>
                      <span className="min-w-0 flex-1 truncate nf-t">{c.meeting_title}</span>
                      <span className="shrink-0 font-mono tabular-nums nf-t2">{formatTimestamp(c.start)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

/* --------------------------------------------------------------------- bits */

function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-[15px] font-medium nf-t">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-xs nf-t2 transition-colors hover:text-[color:var(--nf-text)]">
          View all <ChevronRightIcon className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_336px]">
      <div className="flex flex-col gap-8">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div>
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-11 w-16 rounded-lg" />
                <div className="flex-1"><Skeleton className="h-4 w-2/3" /><Skeleton className="mt-2 h-3 w-1/3" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}
