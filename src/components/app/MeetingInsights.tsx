"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError, type IntelligenceDTO } from "@/lib/api";
import { Skeleton } from "@/components/Skeleton";
import { SparkleIcon, CheckIcon } from "@/components/icons";

/**
 * Real Groq meeting intelligence (Phase 5): summary, key points, decisions, action items.
 * Generated from the real transcript on the backend; polls while "generating". Truthful states.
 */
export function MeetingInsights({ meetingId }: { meetingId: string }) {
  const [data, setData] = useState<IntelligenceDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<IntelligenceDTO>(`/api/v1/meetings/${meetingId}/intelligence`);
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load insights.");
    }
  }, [meetingId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll while insights are still being generated.
  useEffect(() => {
    if (data?.state !== "generating") return;
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [data?.state, load]);

  if (error) {
    return <Panel><p className="text-sm text-muted">{error}</p></Panel>;
  }
  if (!data) {
    return (
      <Panel>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-11/12" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </Panel>
    );
  }
  if (data.state === "unavailable") return null;
  if (data.state === "generating" || !data.content) {
    return (
      <Panel>
        <p className="flex items-center gap-2 text-sm text-muted">
          <SparkleIcon className="h-4 w-4 animate-pulse text-primary" />
          Generating insights from the transcript…
        </p>
      </Panel>
    );
  }

  const c = data.content;
  return (
    <div className="mb-8 space-y-6 rounded-xl border border-border bg-surface/50 p-5">
      <div className="flex items-center gap-2">
        <SparkleIcon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">AI summary</h2>
      </div>

      {c.summary && <p className="text-sm leading-relaxed text-foreground/90">{c.summary}</p>}

      {c.key_points.length > 0 && (
        <Section title="Key points">
          <ul className="space-y-1.5">
            {c.key_points.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/85">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
                {p}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {c.decisions.length > 0 && (
        <Section title="Decisions">
          <ul className="space-y-1.5">
            {c.decisions.map((d, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/85">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {d.text}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {c.action_items.length > 0 && (
        <Section title="Action items">
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
        </Section>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mb-8 rounded-xl border border-border bg-surface/50 p-5">{children}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}
