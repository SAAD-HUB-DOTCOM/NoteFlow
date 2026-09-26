"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiFetch,
  ApiError,
  type MeetingDTO,
  type ActionItemDTO,
  type IntelligenceDTO,
} from "@/lib/api";
import { statusKind } from "@/lib/meetingStatus";
import { SourceMoment } from "@/components/app/SourceMoment";
import { EmptyCard, ErrorCard } from "@/components/app/ActionItemsList";
import { SparkleIcon } from "@/components/icons";

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
function shortDate(v: string): string | null {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : SHORT_DATE.format(d);
}

type Decision = { text: string; meetingId: string; meetingTitle: string; date: string };

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; hasMeetings: boolean; readyCount: number; decisions: Decision[]; actions: ActionItemDTO[] };

/**
 * The cross-meeting intelligence below Ask (Phase 5). Only real data:
 * - Commitments = aggregated GET /api/v1/action-items (with resolved timestamps).
 * - Recent decisions = real `intelligence.decisions` assembled from the most recent ready meetings
 *   (no aggregate endpoint exists, so it's bounded client-side; no per-decision timestamp is
 *   fabricated — decisions have no resolvable segment start without the transcript).
 * Recurring-topic/theme data has no backend source, so that section is deliberately omitted.
 */
export function IntelligenceView() {
  const [state, setState] = useState<State>({ phase: "loading" });

  const load = useCallback(async () => {
    try {
      const [meetings, actions] = await Promise.all([
        apiFetch<MeetingDTO[]>("/api/v1/meetings"),
        apiFetch<ActionItemDTO[]>("/api/v1/action-items").catch(() => [] as ActionItemDTO[]),
      ]);

      const recent = meetings
        .filter((m) => statusKind(m.status) === "ready")
        .sort((a, b) => new Date(b.started_at ?? b.created_at).getTime() - new Date(a.started_at ?? a.created_at).getTime())
        .slice(0, 10);

      const intel = await Promise.all(
        recent.map((m) =>
          apiFetch<IntelligenceDTO>(`/api/v1/meetings/${m.id}/intelligence`)
            .then((d) => ({ m, d }))
            .catch(() => null),
        ),
      );

      const decisions: Decision[] = [];
      for (const x of intel) {
        if (!x || x.d.state !== "ready" || !x.d.content) continue;
        for (const dec of x.d.content.decisions) {
          decisions.push({
            text: dec.text,
            meetingId: x.m.id,
            meetingTitle: x.m.title || "Untitled meeting",
            date: x.m.started_at ?? x.m.created_at,
          });
        }
      }

      setState({ phase: "ready", hasMeetings: meetings.length > 0, readyCount: recent.length, decisions: decisions.slice(0, 14), actions });
    } catch (e) {
      setState({ phase: "error", message: e instanceof ApiError ? e.message : "Couldn’t load your intelligence." });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (state.phase === "loading") return <Skeleton />;
  if (state.phase === "error") return <div className="mt-12"><ErrorCard message={state.message} /></div>;

  if (!state.hasMeetings) {
    return (
      <div className="mt-12">
        <EmptyCard
          icon={<SparkleIcon className="h-5 w-5 nf-tm" />}
          title="No conversations yet"
          body="Once you've captured a few meetings, NoteFlow surfaces what they collectively tell you here — decisions, open threads, and answers across everything."
        />
      </div>
    );
  }

  const { decisions, actions, readyCount } = state;

  return (
    <div className="mt-12 grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-2">
      {/* Recent decisions */}
      <section>
        <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] nf-tf">Recent decisions</h2>
        <div className="mt-1.5 border-t" style={{ borderColor: "var(--nf-hairline)" }} />
        {decisions.length === 0 ? (
          <p className="mt-4 text-sm nf-tm">
            {readyCount === 0
              ? "Decisions appear here once your meetings finish processing."
              : "No decisions were detected across your recent meetings yet."}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {decisions.map((d, i) => (
              <li key={`${d.meetingId}-${i}`}>
                {i > 0 && <div className="border-t" style={{ borderColor: "var(--nf-hairline)" }} />}
                <div className="flex gap-4 py-4">
                  <span className="w-11 shrink-0 pt-0.5 font-mono text-[11px] tabular-nums nf-tm">{shortDate(d.date) ?? ""}</span>
                  <div className="relative min-w-0 flex-1 pl-4">
                    <span className="absolute bottom-0.5 left-0 top-0.5 w-px" style={{ background: "var(--nf-border)" }} aria-hidden="true" />
                    <p className="text-[15px] leading-[1.5] nf-t" dir="auto">{d.text}</p>
                    <div className="mt-2.5">
                      <SourceMoment meetingId={d.meetingId} meetingTitle={d.meetingTitle} start={null} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Open threads / commitments */}
      <section>
        <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] nf-tf">Open threads</h2>
        <div className="mt-1.5 border-t" style={{ borderColor: "var(--nf-hairline)" }} />
        {actions.length === 0 ? (
          <p className="mt-4 text-sm nf-tm">No open commitments across your conversations yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {actions.slice(0, 14).map((a, i) => (
              <li key={`${a.meeting_id}-${i}`}>
                {i > 0 && <div className="border-t" style={{ borderColor: "var(--nf-hairline)" }} />}
                <div className="flex gap-3.5 py-4">
                  <span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ border: "1.5px solid var(--nf-border-strong)" }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug nf-t" dir="auto">{a.text}</p>
                    <div className="mt-2.5">
                      <SourceMoment meetingId={a.meeting_id} meetingTitle={a.meeting_title} start={a.start} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-12 grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-2">
      {[0, 1].map((col) => (
        <div key={col}>
          <div className="h-3 w-32 rounded" style={{ background: "var(--nf-surface-3)" }} />
          <div className="mt-3 border-t" style={{ borderColor: "var(--nf-hairline)" }} />
          <div className="mt-4 flex flex-col gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-3 w-10 shrink-0 rounded" style={{ background: "var(--nf-surface-2)" }} />
                <div className="flex-1">
                  <div className="h-4 w-3/4 rounded" style={{ background: "var(--nf-surface-3)" }} />
                  <div className="mt-2 h-3 w-2/5 rounded" style={{ background: "var(--nf-surface-2)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
