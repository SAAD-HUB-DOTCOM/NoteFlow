"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError, type MeetingDTO } from "@/lib/api";
import { RealMeetingCard } from "@/components/app/RealMeetingCard";
import { RecordMeetingButton } from "@/components/app/RecordMeetingButton";
import { Skeleton } from "@/components/Skeleton";
import { MicIcon } from "@/components/icons";

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; meetings: MeetingDTO[] };

/** Real meetings for the signed-in user (GET /api/v1/meetings) with truthful states. */
export function MeetingsList() {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let alive = true;
    apiFetch<MeetingDTO[]>("/api/v1/meetings")
      .then((meetings) => alive && setState({ phase: "ready", meetings }))
      .catch((e) =>
        alive &&
        setState({
          phase: "error",
          message: e instanceof ApiError ? e.message : "Couldn’t load your meetings.",
        }),
      );
    return () => {
      alive = false;
    };
  }, []);

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
    );
  }

  return (
    <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
      {state.meetings.map((m) => (
        <RealMeetingCard key={m.id} meeting={m} />
      ))}
    </div>
  );
}
