"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { publicFetch, ApiError, type SharedMeetingDTO } from "@/lib/api";
import { formatDuration, formatFullDate, formatTimestamp, initialsFrom } from "@/lib/format";
import { Skeleton } from "@/components/Skeleton";
import { SparkleIcon, CheckIcon, LockIcon } from "@/components/icons";

/**
 * Public, read-only shared meeting view (no auth). Fetches GET /api/v1/shared/{shareId}. Shows the
 * transcript + AI summary only — never owner identity, meeting URL, or playback (that stays owner-
 * scoped). Revoked or unknown links render an honest "not available" state.
 */
export default function SharedMeetingPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = use(params);
  const [data, setData] = useState<SharedMeetingDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setData(await publicFetch<SharedMeetingDTO>(`/api/v1/shared/${shareId}`));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "This shared link isn’t available.");
      }
    })();
  }, [shareId]);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-reading px-4 py-20 text-center sm:px-6">
        <p className="text-base font-medium text-foreground">This link isn’t available</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{error}</p>
        <Link
          href="/product"
          className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          About NoteFlow
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-reading px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-3 h-4 w-40" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </main>
    );
  }

  const c = data.intelligence;

  return (
    <main className="mx-auto w-full max-w-reading px-4 py-10 sm:px-6">
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
        <LockIcon className="h-3.5 w-3.5" />
        Shared · read-only
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {data.title || "Untitled meeting"}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        {data.started_at && <span>{formatFullDate(data.started_at)}</span>}
        {data.duration_seconds != null && <span>{formatDuration(data.duration_seconds)}</span>}
      </div>

      {c && (
        <div className="mt-8 space-y-6 rounded-xl border border-border bg-surface/50 p-5">
          <div className="flex items-center gap-2">
            <SparkleIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">AI summary</h2>
          </div>
          {c.summary && <p className="text-sm leading-relaxed text-foreground/90">{c.summary}</p>}
          {c.key_points?.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Key points</h3>
              <ul className="space-y-1.5">
                {c.key_points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/85">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {c.action_items?.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Action items</h3>
              <ul className="space-y-2">
                {c.action_items.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-foreground/90">
                      {a.text}
                      {a.owner && <span className="ml-2 text-xs text-muted">· {a.owner}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-sm font-semibold text-foreground">Transcript</h2>
      {data.segments.length === 0 ? (
        <p className="text-sm text-muted">No transcript was produced for this meeting.</p>
      ) : (
        <ol className="space-y-0.5">
          {data.segments.map((seg) => {
            const name = seg.speaker || "Speaker";
            return (
              <li key={seg.id} className="flex gap-3 rounded-lg px-3 py-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center self-start rounded-full bg-surface-hover text-[0.65rem] font-medium text-foreground/90 ring-1 ring-border/60">
                  {initialsFrom(name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground/90">{name}</span>
                    <span className="font-mono text-xs tabular-nums text-muted">
                      {formatTimestamp(seg.start)}
                    </span>
                  </span>
                  <span className="block text-sm leading-relaxed text-foreground/80">{seg.text}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted">
        Shared with{" "}
        <Link href="/product" className="text-primary hover:underline">
          NoteFlow
        </Link>
      </footer>
    </main>
  );
}
