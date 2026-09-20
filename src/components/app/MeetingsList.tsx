"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError, type MeetingDTO } from "@/lib/api";
import { RealMeetingCard } from "@/components/app/RealMeetingCard";
import { RecordMeetingButton } from "@/components/app/RecordMeetingButton";
import { ConnectionBadge } from "@/components/app/ConnectionBadge";
import { useMeetingsRealtime } from "@/components/app/RealtimeProvider";
import { Skeleton } from "@/components/Skeleton";
import { MicIcon } from "@/components/icons";

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; meetings: MeetingDTO[] };

/**
 * Real meetings (GET /api/v1/meetings) with truthful states. Reflects lifecycle changes live via
 * Supabase Realtime — refetches REST on a broadcast (the source of truth) and on every reconnect.
 */
export function MeetingsList() {
  const [state, setState] = useState<State>({ phase: "loading" });
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

  // Initial load.
  useEffect(() => {
    void load();
  }, [load]);

  // Refetch on each (re)connect so we never miss a change while offline.
  useEffect(() => {
    if (connectionEpoch > 0) void load();
  }, [connectionEpoch, load]);

  // Refetch (debounced) when a meeting broadcast arrives.
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

  // Degraded mode: while realtime is NOT connected, poll gently so the list still updates.
  useEffect(() => {
    if (rtStatus === "connected") return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 10_000);
    return () => clearInterval(timer);
  }, [rtStatus, load]);

  if (state.phase === "loading") {
    return (
      <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="rounded-xl border border-border bg-surface/50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">Couldn’t load your meetings</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{state.message}</p>
      </div>
    );
  }

  if (state.meetings.length === 0) {
    return (
      <div>
        <div className="mb-3 flex justify-end">
          <ConnectionBadge />
        </div>
        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-border bg-surface">
            <MicIcon className="h-5 w-5 text-muted" />
          </div>
          <p className="text-base font-medium text-foreground">No meetings yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
            Record your first meeting — NoteFlow joins, captures it, and transcribes it
            automatically.
          </p>
          <div className="mt-5 flex justify-center">
            <RecordMeetingButton label="Record a meeting" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <ConnectionBadge />
      </div>
      <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
        {state.meetings.map((m) => (
          <RealMeetingCard key={m.id} meeting={m} />
        ))}
      </div>
    </div>
  );
}
