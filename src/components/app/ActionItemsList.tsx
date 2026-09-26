"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError, type ActionItemDTO } from "@/lib/api";
import { ChecklistIcon, SearchIcon } from "@/components/icons";
import { SourceMoment } from "@/components/app/SourceMoment";
import { SelectMenu } from "@/components/app/SelectMenu";

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
function shortDate(v: string): string | null {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : SHORT_DATE.format(d);
}

/**
 * Action items — commitments extracted from conversations (owner-scoped, GET /api/v1/action-items).
 * An open editorial list, not a task board. Each item keeps its link to the meeting + moment that
 * created it. Completion is NOT backed by an endpoint, so the marker is a static semantic circle —
 * never a fake checkbox.
 */
export function ActionItemsList() {
  const [items, setItems] = useState<ActionItemDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [meeting, setMeeting] = useState("all");

  const load = useCallback(async () => {
    try {
      setItems(await apiFetch<ActionItemDTO[]>("/api/v1/action-items"));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load your action items.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const meetingOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const it of items ?? []) if (!seen.has(it.meeting_id)) seen.set(it.meeting_id, it.meeting_title);
    return [{ value: "all", label: "All meetings" }, ...[...seen].map(([value, label]) => ({ value, label }))];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((it) => {
      if (meeting !== "all" && it.meeting_id !== meeting) return false;
      if (q && !`${it.text} ${it.owner ?? ""} ${it.meeting_title}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, query, meeting]);

  if (error) return <ErrorCard message={error} />;
  if (!items) return <ListSkeleton />;
  if (items.length === 0) {
    return (
      <EmptyCard
        icon={<ChecklistIcon className="h-5 w-5 nf-tm" />}
        title="No action items yet"
        body="Once your meetings are transcribed, any tasks or follow-ups NoteFlow finds show up here — each linked to the moment it was said."
      />
    );
  }

  return (
    <div>
      <Toolbar query={query} onQuery={setQuery} meeting={meeting} onMeeting={setMeeting} options={meetingOptions} />

      {filtered.length === 0 ? (
        <NoResults onClear={() => { setQuery(""); setMeeting("all"); }} />
      ) : (
        <ul className="mt-6 flex flex-col">
          {filtered.map((it, i) => {
            const date = shortDate(it.meeting_date);
            const meta = [it.owner, date].filter(Boolean).join(" · ");
            return (
              <li key={`${it.meeting_id}-${i}`}>
                {i > 0 && <div className="mx-2 border-t" style={{ borderColor: "var(--nf-hairline)" }} />}
                <div className="nf-row group flex gap-3.5 rounded-lg px-2 py-5">
                  <span className="mt-[3px] h-4 w-4 shrink-0 rounded-full transition-colors group-hover:border-[var(--nf-text-muted)]" style={{ border: "1.5px solid var(--nf-border-strong)" }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15.5px] leading-snug nf-t" dir="auto">{it.text}</p>
                    {meta && <p className="mt-1.5 text-xs nf-tm">{meta}</p>}
                    <div className="mt-3">
                      <SourceMoment meetingId={it.meeting_id} meetingTitle={it.meeting_title} start={it.start} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------- shared list toolbar */

function Toolbar({
  query,
  onQuery,
  meeting,
  onMeeting,
  options,
  placeholder = "Search…",
}: {
  query: string;
  onQuery: (v: string) => void;
  meeting: string;
  onMeeting: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="nf-input flex min-w-0 flex-1 items-center gap-2.5 px-4 py-2.5">
        <SearchIcon className="h-4 w-4 shrink-0 nf-tm" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full bg-transparent text-sm nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none"
        />
      </div>
      {options.length > 1 && (
        <div className="sm:shrink-0">
          <SelectMenu value={meeting} options={options} onChange={onMeeting} ariaLabel="Filter by meeting" />
        </div>
      )}
    </div>
  );
}
export { Toolbar as ListToolbar };

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm nf-t2">Nothing matches your filters.</p>
      <button type="button" onClick={onClear} className="mt-3 text-sm underline underline-offset-4 nf-t2 transition-colors hover:text-[color:var(--nf-text)]">
        Clear
      </button>
    </div>
  );
}
export { NoResults as ListNoResults };

/* ----------------------------------------------------- shared list states -- */

export function ListSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3.5">
          <div className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ background: "var(--nf-surface-3)" }} />
          <div className="flex-1">
            <div className="h-4 w-2/3 rounded" style={{ background: "var(--nf-surface-3)" }} />
            <div className="mt-2 h-3 w-2/5 rounded" style={{ background: "var(--nf-surface-2)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="nf-card px-6 py-16 text-center">
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--nf-surface-2)", border: "1px solid var(--nf-border)" }}>
        {icon}
      </div>
      <p className="text-base font-medium nf-t">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed nf-tm">{body}</p>
    </div>
  );
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <div className="nf-card px-6 py-12 text-center">
      <p className="text-sm font-medium nf-t">Something went wrong</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm nf-tm">{message}</p>
    </div>
  );
}
