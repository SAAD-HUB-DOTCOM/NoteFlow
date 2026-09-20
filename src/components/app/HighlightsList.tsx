"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError, type HighlightDTO } from "@/lib/api";
import { BookmarkFilledIcon } from "@/components/icons";
import {
  EmptyCard,
  ErrorCard,
  ListSkeleton,
  MeetingRef,
} from "@/components/app/ActionItemsList";

/** Key moments NoteFlow auto-detected across every meeting's real AI intelligence (owner-scoped). */
export function HighlightsList() {
  const [items, setItems] = useState<HighlightDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await apiFetch<HighlightDTO[]>("/api/v1/highlights"));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load your highlights.");
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
        icon={<BookmarkFilledIcon className="h-5 w-5 text-muted" />}
        title="No highlights yet"
        body="After a meeting is transcribed, the key moments NoteFlow detects appear here — each linked to the exact spot in the recording."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((h, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-xl border border-border bg-surface/50 px-4 py-3"
        >
          <BookmarkFilledIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground/90">{h.title}</p>
            <MeetingRef meetingId={h.meeting_id} title={h.meeting_title} start={h.start} />
          </div>
        </li>
      ))}
    </ul>
  );
}
