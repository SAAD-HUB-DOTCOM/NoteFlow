"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError, type IntelligenceDTO, type TranscriptDTO } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { SparkleIcon, CheckIcon, ChevronRightIcon } from "@/components/icons";

/**
 * Real Groq meeting intelligence, redesigned as the editorial left pane of the workspace
 * (Phase 3). Same endpoint + truthful states + polling while "generating". Sections are typographic
 * — not a grid of cards. Decisions / actions / important moments resolve their real `segment_ids`
 * to a transcript start time and reuse the existing seekTo, so timestamps connect to the player.
 * Nothing is inferred: sections render only from real generated content.
 */
export function MeetingInsights({
  meetingId,
  segments,
  onSeek,
}: {
  meetingId: string;
  segments: TranscriptDTO["segments"];
  onSeek: (seconds: number) => void;
}) {
  const [data, setData] = useState<IntelligenceDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const triggeredRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<IntelligenceDTO>(`/api/v1/meetings/${meetingId}/intelligence`);
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load insights.");
    }
  }, [meetingId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (data?.state !== "generating") return;
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [data?.state, load]);

  // Generation otherwise only runs once at transcript-processing time; if a meeting is stuck
  // "generating" (processed before that code, or a transient Groq failure), kick the idempotent
  // backend (re)generator so it backfills. Polling above then picks up the "ready" row.
  const trigger = useCallback(async () => {
    setRetrying(true);
    try {
      await apiFetch<IntelligenceDTO>(`/api/v1/meetings/${meetingId}/intelligence`, { method: "POST" });
    } catch {
      /* best-effort; the polling GET keeps checking */
    } finally {
      setRetrying(false);
      void load();
    }
  }, [meetingId, load]);

  useEffect(() => {
    if (data?.state === "generating" && !triggeredRef.current) {
      triggeredRef.current = true;
      void trigger();
    }
  }, [data?.state, trigger]);

  const startOf = (ids: string[]): number | null => {
    for (const id of ids) {
      const s = segments.find((seg) => seg.id === id);
      if (s) return s.start;
    }
    return null;
  };

  if (error) return <Quiet>{error}</Quiet>;
  if (!data) {
    return (
      <div className="space-y-2.5">
        <div className="h-4 w-full rounded" style={{ background: "var(--nf-surface-3)" }} />
        <div className="h-4 w-11/12 rounded" style={{ background: "var(--nf-surface-2)" }} />
        <div className="h-4 w-3/4 rounded" style={{ background: "var(--nf-surface-2)" }} />
      </div>
    );
  }
  if (data.state === "unavailable") {
    return <Quiet>No summary was generated for this meeting.</Quiet>;
  }
  if (data.state === "generating" || !data.content) {
    return (
      <div>
        <p className="flex items-center gap-2 text-sm nf-t2">
          <SparkleIcon className="h-4 w-4 animate-pulse" />
          Generating insights from the transcript…
        </p>
        <button
          type="button"
          onClick={() => { triggeredRef.current = true; void trigger(); }}
          disabled={retrying}
          className="nf-btn-secondary mt-3 px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {retrying ? "Generating…" : "Try again"}
        </button>
      </div>
    );
  }

  const c = data.content;

  return (
    <div>
      {/* Executive summary — the primary reading object */}
      {c.summary && (
        <section className="max-w-[60ch]">
          <h3 className="mb-3 text-[15px] font-medium tracking-[-0.01em] nf-t2">Executive summary</h3>
          <p className="text-[15px] leading-[1.78] nf-t" dir="auto">{c.summary}</p>
        </section>
      )}

      {c.key_points.length > 0 && (
        <Section label="Key points">
          <ul className="space-y-2.5">
            {c.key_points.map((p, i) => (
              <li key={i} className="flex gap-2.5 text-[14px] leading-[1.6] nf-t2" dir="auto">
                <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--nf-text-muted)" }} />
                {p}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {c.decisions.length > 0 && (
        <Section label="Decisions">
          <ul className="space-y-1">
            {c.decisions.map((d, i) => (
              <ResolvableRow key={i} start={startOf(d.segment_ids)} onSeek={onSeek}>
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--nf-ready)" }} />
                <span className="min-w-0 flex-1 text-[14px] leading-snug nf-t" dir="auto">{d.text}</span>
              </ResolvableRow>
            ))}
          </ul>
        </Section>
      )}

      {c.action_items.length > 0 && (
        <Section label="Actions">
          <ul className="space-y-1.5">
            {c.action_items.map((a, i) => (
              <ResolvableRow key={i} start={startOf(a.segment_ids)} onSeek={onSeek}>
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full" style={{ border: "1.5px solid var(--nf-border-strong)" }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] leading-snug nf-t" dir="auto">{a.text}</span>
                  {a.owner && <span className="mt-0.5 block text-xs nf-tm">{a.owner}</span>}
                </span>
              </ResolvableRow>
            ))}
          </ul>
        </Section>
      )}

      {c.important_moments.length > 0 && (
        <Section label="Important moments">
          <ul className="space-y-0.5">
            {c.important_moments.map((m, i) => {
              const start = startOf(m.segment_ids);
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => start != null && onSeek(start)}
                    disabled={start == null}
                    className="nf-row group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left disabled:cursor-default"
                  >
                    {start != null && (
                      <span className="shrink-0 font-mono text-[11px] tabular-nums nf-t2">{formatTimestamp(start)}</span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-[14px] nf-t" dir="auto">{m.title}</span>
                    {start != null && (
                      <ChevronRightIcon className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 nf-tm" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </div>
  );
}

/** A left-content row that reveals a seekable "mm:ss →" on hover when a real segment resolves. */
function ResolvableRow({ start, onSeek, children }: { start: number | null; onSeek: (s: number) => void; children: React.ReactNode }) {
  if (start == null) {
    return <li className="flex items-start gap-2.5 px-2 py-1.5">{children}</li>;
  }
  return (
    <li>
      <button type="button" onClick={() => onSeek(start)} className="nf-row group flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left">
        {children}
        <span className="ml-auto flex shrink-0 items-center gap-1 self-center font-mono text-[11px] tabular-nums nf-tm opacity-0 transition-opacity group-hover:opacity-100">
          {formatTimestamp(start)}
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </span>
      </button>
    </li>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] nf-tf">{children}</h3>;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-9 border-t pt-8" style={{ borderColor: "var(--nf-hairline)" }}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </section>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return <p className="text-sm nf-tm">{children}</p>;
}
