"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type MeetingDTO, type ShareDTO } from "@/lib/api";
import { formatFullDate } from "@/lib/format";
import { ShareIcon } from "@/components/icons";
import { EmptyCard, ErrorCard, ListSkeleton } from "@/components/app/ActionItemsList";

/** Meetings the user has shared via a public read-only link, with copy / open / revoke controls. */
export function SharedMeetingsList() {
  const [meetings, setMeetings] = useState<MeetingDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await apiFetch<MeetingDTO[]>("/api/v1/meetings");
      setMeetings(all.filter((m) => m.share_id));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load your shared meetings.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const publicUrl = (shareId: string) =>
    typeof window === "undefined" ? `/s/${shareId}` : `${window.location.origin}/s/${shareId}`;

  const copy = async (shareId: string) => {
    try {
      await navigator.clipboard.writeText(publicUrl(shareId));
      setCopied(shareId);
      setTimeout(() => setCopied((c) => (c === shareId ? null : c)), 2000);
    } catch {
      /* clipboard blocked — the link is still visible to select manually */
    }
  };

  const revoke = async (meetingId: string) => {
    await apiFetch<ShareDTO>(`/api/v1/meetings/${meetingId}/share`, { method: "DELETE" });
    void load();
  };

  if (error) return <ErrorCard message={error} />;
  if (!meetings) return <ListSkeleton />;
  if (meetings.length === 0) {
    return (
      <EmptyCard
        icon={<ShareIcon className="h-5 w-5 text-muted" />}
        title="Nothing shared yet"
        body="Open a meeting and use Share to create a public read-only link. Shared meetings show up here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {meetings.map((m) => (
        <li key={m.id} className="rounded-xl border border-border bg-surface/50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href={`/app/meetings/${m.id}`}
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {m.title || "Untitled meeting"}
            </Link>
            <span className="text-xs text-muted">{formatFullDate(m.started_at ?? m.created_at)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-muted">
              {publicUrl(m.share_id!)}
            </code>
            <button
              type="button"
              onClick={() => void copy(m.share_id!)}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground/90 transition-colors hover:bg-surface-hover"
            >
              {copied === m.share_id ? "Copied" : "Copy link"}
            </button>
            <a
              href={publicUrl(m.share_id!)}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground/90 transition-colors hover:bg-surface-hover"
            >
              Open
            </a>
            <button
              type="button"
              onClick={() => void revoke(m.id)}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
            >
              Revoke
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
