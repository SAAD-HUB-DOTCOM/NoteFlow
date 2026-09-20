"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type ActionItemDTO } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { Skeleton } from "@/components/Skeleton";
import { CheckIcon, ChecklistIcon } from "@/components/icons";

/** Action items rolled up from every meeting's real AI intelligence (owner-scoped). */
export function ActionItemsList() {
  const [items, setItems] = useState<ActionItemDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await apiFetch<ActionItemDTO[]>("/api/v1/action-items"));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load your action items.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorCard message={error} />;
  if (!items) return <ListSkeleton />;
  if (items.length === 0) {
    return (
      <EmptyCard
        icon={<ChecklistIcon className="h-5 w-5 text-muted" />}
        title="No action items yet"
        body="Once your meetings are transcribed, any tasks or follow-ups NoteFlow finds show up here."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-xl border border-border bg-surface/50 px-4 py-3"
        >
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground/90">
              {it.text}
              {it.owner && <span className="ml-2 text-xs text-muted">· {it.owner}</span>}
            </p>
            <MeetingRef
              meetingId={it.meeting_id}
              title={it.meeting_title}
              start={it.start}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MeetingRef({
  meetingId,
  title,
  start,
}: {
  meetingId: string;
  title: string;
  start: number | null;
}) {
  return (
    <Link
      href={`/app/meetings/${meetingId}`}
      className="mt-1 inline-flex items-center gap-2 text-xs text-muted transition-colors hover:text-primary"
    >
      <span className="truncate">{title}</span>
      {start != null && (
        <span className="font-mono tabular-nums text-primary">{formatTimestamp(start)}</span>
      )}
    </Link>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function EmptyCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-border bg-surface">
        {icon}
      </div>
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{body}</p>
    </div>
  );
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">Something went wrong</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}
