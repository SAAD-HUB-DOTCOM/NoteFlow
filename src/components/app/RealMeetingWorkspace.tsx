"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type MeetingDTO, type TranscriptDTO } from "@/lib/api";
import { statusKind, statusLabel } from "@/lib/meetingStatus";
import { formatDuration, formatFullDate, formatTimestamp, initialsFrom } from "@/lib/format";
import { Skeleton } from "@/components/Skeleton";
import { StatusChip } from "@/components/app/StatusChip";
import { ConnectionBadge } from "@/components/app/ConnectionBadge";
import { MeetingInsights } from "@/components/app/MeetingInsights";
import { MeetingAsk } from "@/components/app/MeetingAsk";
import { RecordingPlayer, type RecordingPlayerHandle } from "@/components/app/RecordingPlayer";
import { useMeetingsRealtime } from "@/components/app/RealtimeProvider";
import { CalendarIcon, ChevronRightIcon, ClockIcon, MicIcon, UsersIcon } from "@/components/icons";

/**
 * The real meeting workspace (Phase 6): loads GET /meetings/{id} + /meetings/{id}/transcript and
 * renders the real transcript (speaker, timestamp, text) with truthful loading / capturing /
 * transcribing / failed / empty states. Polls while the meeting is still in flight so the
 * transcript appears automatically. No playback sync / summary / Ask yet (later phases).
 */
export function RealMeetingWorkspace({ meetingId }: { meetingId: string }) {
  const [meeting, setMeeting] = useState<MeetingDTO | null>(null);
  const [transcript, setTranscript] = useState<TranscriptDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    void load();
  }, [load]);

  // Refetch on each (re)connect (catches anything missed while offline). `load` refetches both
  // the meeting and its transcript, so a status→ready transition pulls the transcript in.
  useEffect(() => {
    if (connectionEpoch > 0) void load();
  }, [connectionEpoch, load]);

  // Live updates: a meeting broadcast → debounced REST refetch.
  useEffect(() => {
    const unsub = onMeetingChange(() => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => void load(), 300);
    });
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
      unsub();
    };
  }, [onMeetingChange, load]);

  // Degraded mode: while realtime is NOT connected, poll gently so the page still updates.
  useEffect(() => {
    if (rtStatus === "connected") return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 10_000);
    return () => clearInterval(timer);
  }, [rtStatus, load]);

  if (loading) return <WorkspaceSkeleton />;

  if (error || !meeting) {
    return (
      <main className="mx-auto w-full max-w-reading px-4 py-16 text-center sm:px-6">
        <p className="text-base font-medium text-foreground">Couldn’t open this meeting</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
          {error ?? "It may not exist, or you may not have access."}
        </p>
        <Link
          href="/app/meetings"
          className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Back to My Meetings
        </Link>
      </main>
    );
  }

  const kind = statusKind(meeting.status);
  const segments = transcript?.segments ?? [];
  const speakerCount = new Set(segments.map((s) => s.speaker).filter(Boolean)).size;
  const when = meeting.started_at ?? meeting.created_at;

  return (
    <main className="min-w-0 flex-1 px-4 py-7 sm:px-6">
      <nav className="flex items-center gap-1 text-sm text-muted">
        <Link href="/app/meetings" className="transition-colors hover:text-foreground">
          My Meetings
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <span className="truncate text-foreground/80">{meeting.title || "Untitled meeting"}</span>
      </nav>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {meeting.title || "Untitled meeting"}
          </h1>
          <StatusChip status={meeting.status} />
          <ConnectionBadge />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4" />
            {formatFullDate(when)}
          </span>
          {meeting.duration_seconds != null && (
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" />
              {formatDuration(meeting.duration_seconds)}
            </span>
          )}
          {speakerCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <UsersIcon className="h-4 w-4" />
              {speakerCount} {speakerCount === 1 ? "speaker" : "speakers"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-8">
        {kind === "failed" ? (
          <StateCard
            title="Processing failed"
            body="NoteFlow couldn’t finish processing this meeting. You can try recording again."
            tone="danger"
          />
        ) : kind === "live" ? (
          <StateCard
            title="NoteFlow is in the meeting"
            body={`${statusLabel(meeting.status)}. The transcript appears here automatically once the call ends and processing finishes.`}
          />
        ) : kind === "processing" ? (
          <StateCard
            title="Transcribing…"
            body="The recording is being transcribed. This page updates on its own — no need to refresh."
            pulse
          />
        ) : segments.length === 0 ? (
          <StateCard
            title="No transcript available"
            body="This meeting is ready but no transcript segments were produced."
          />
        ) : (
          <div className="max-w-reading">
            <RecordingPlayer ref={playerRef} meetingId={meeting.id} onTime={setCurrentTime} />
            <MeetingAsk
              meetingId={meeting.id}
              segments={segments}
              onSeek={(seconds) => playerRef.current?.seekTo(seconds)}
            />
            <MeetingInsights meetingId={meeting.id} />
            <h2 className="mb-3 text-sm font-semibold text-foreground">Transcript</h2>
            <Transcript
              segments={segments}
              currentTime={currentTime}
              onSeek={(seconds) => playerRef.current?.seekTo(seconds)}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function Transcript({
  segments,
  currentTime,
  onSeek,
}: {
  segments: TranscriptDTO["segments"];
  currentTime: number;
  onSeek: (seconds: number) => void;
}) {
  // Active segment per the spec: start <= currentTime < end (seconds; backend already divides ms).
  const activeId = segments.find((s) => s.start <= currentTime && currentTime < s.end)?.id ?? null;

  const activeRef = useRef<HTMLLIElement>(null);
  // Pause auto-scroll briefly after the user scrolls, so we don't fight manual reading.
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onManualScroll = () => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false;
    }, 5000);
  };

  useEffect(() => {
    if (!activeId || pausedRef.current) return;
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  return (
    <ol
      className="max-w-reading space-y-0.5"
      onWheel={onManualScroll}
      onTouchMove={onManualScroll}
    >
      {segments.map((seg) => {
        const name = seg.speaker || "Speaker";
        const isActive = seg.id === activeId;
        return (
          <li
            key={seg.id}
            ref={isActive ? activeRef : null}
            onClick={() => onSeek(seg.start)}
            className={`flex cursor-pointer gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              isActive ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-surface-hover"
            }`}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center self-start rounded-full bg-surface-hover text-[0.65rem] font-medium text-foreground/90 ring-1 ring-border/60">
              {initialsFrom(name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="mb-0.5 flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground/90">{name}</span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    isActive ? "text-primary" : "text-muted"
                  }`}
                >
                  {formatTimestamp(seg.start)}
                </span>
              </span>
              <span className="block text-sm leading-relaxed text-foreground/80">{seg.text}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StateCard({
  title,
  body,
  tone,
  pulse,
}: {
  title: string;
  body: string;
  tone?: "danger";
  pulse?: boolean;
}) {
  return (
    <div className="max-w-reading rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <div
        className={`mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-border bg-surface ${
          pulse ? "animate-pulse" : ""
        }`}
      >
        <MicIcon className={`h-5 w-5 ${tone === "danger" ? "text-danger" : "text-muted"}`} />
      </div>
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{body}</p>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <main className="min-w-0 flex-1 px-4 py-7 sm:px-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-8 w-2/3 max-w-md" />
      <div className="mt-3 flex gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-8 max-w-reading space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </main>
  );
}
