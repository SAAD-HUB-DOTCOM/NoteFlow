"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type PersonDetailDTO } from "@/lib/api";
import { statusKind, statusLabel } from "@/lib/meetingStatus";
import { ChevronRightIcon } from "@/components/icons";
import { ErrorCard } from "@/components/app/ActionItemsList";
import { PersonMark } from "@/components/app/PersonMark";
import { personDisplayName } from "@/lib/person";

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
function shortDate(v: string | null): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : SHORT_DATE.format(d);
}
function conversationsLabel(n: number): string {
  return `${n} ${n === 1 ? "conversation" : "conversations"}`;
}

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; person: PersonDetailDTO };

/**
 * Person detail (Phase 6D): a conversation history centered on one resolved identity — NOT a
 * contact profile. Only real data from GET /api/v1/people/{id}: the identity header (name, and
 * email/avatar only when known) and the real meetings this person is linked to. No topics,
 * sentiment, roles, orgs, owned action items, or fabricated snippets — the backend doesn't
 * support them reliably.
 */
export function PersonDetail({ id }: { id: string }) {
  const [state, setState] = useState<State>({ phase: "loading" });

  const load = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const person = await apiFetch<PersonDetailDTO>(`/api/v1/people/${id}`);
      setState({ phase: "ready", person });
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.status === 404
            ? "This person doesn’t exist, or isn’t one of yours."
            : e.message
          : "Couldn’t load this person.";
      setState({ phase: "error", message });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const back = (
    <Link
      href="/app/people"
      className="group inline-flex items-center gap-1.5 text-xs nf-t2 transition-colors hover:text-[color:var(--nf-text)]"
    >
      <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>
      People
    </Link>
  );

  if (state.phase === "loading") {
    return (
      <div>
        {back}
        <DetailSkeleton />
      </div>
    );
  }
  if (state.phase === "error") {
    return (
      <div>
        {back}
        <div className="mt-8">
          <ErrorCard message={state.message} />
        </div>
      </div>
    );
  }

  const { person } = state;
  const name = personDisplayName(person);
  const lastDate = shortDate(person.last_conversation_at);

  return (
    <div>
      {back}

      {/* Identity header — quiet + editorial, no giant profile card. */}
      <header className="mt-6 flex items-start gap-4">
        <PersonMark
          displayName={person.display_name}
          email={person.email}
          avatarUrl={person.avatar_url}
          size="lg"
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="truncate text-[1.4rem] font-medium tracking-[-0.02em] nf-t" dir="auto">
            {name}
          </h1>
          {/* Email as a secondary line only when it isn't already standing in as the name. */}
          {person.email && person.display_name?.trim() && (
            <p className="truncate text-sm nf-tm" dir="auto">{person.email}</p>
          )}
          <p className="mt-2 text-xs nf-tm">
            {conversationsLabel(person.conversation_count)}
            {lastDate && <> · Last conversation {lastDate}</>}
          </p>
        </div>
      </header>

      {/* Conversation history */}
      <section className="mt-10">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] nf-tf">Conversations</h2>
        <div className="mt-1.5 border-t" style={{ borderColor: "var(--nf-hairline)" }} />

        {person.meetings.length === 0 ? (
          <p className="mt-4 text-sm nf-tm">No conversations are linked to this person yet.</p>
        ) : (
          <ul className="mt-1 flex flex-col">
            {person.meetings.map((m, i) => (
              <li key={m.id}>
                {i > 0 && <div className="mx-2 border-t" style={{ borderColor: "var(--nf-hairline)" }} />}
                <Link
                  href={`/app/meetings/${m.id}`}
                  className="nf-row group flex items-center gap-4 rounded-lg px-2 py-4"
                >
                  <span className="w-12 shrink-0 font-mono text-[11px] tabular-nums nf-tm">
                    {shortDate(m.started_at ?? m.created_at) ?? ""}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px] nf-t" dir="auto">
                    {m.title || "Untitled meeting"}
                  </span>
                  <MeetingStatus status={m.status} />
                  <ChevronRightIcon className="h-4 w-4 shrink-0 nf-tm transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MeetingStatus({ status }: { status: string }) {
  const kind = statusKind(status);
  return (
    <span className="hidden items-center gap-1.5 text-xs nf-tm sm:inline-flex">
      <span
        className={`h-1.5 w-1.5 rounded-full ${kind === "live" || kind === "processing" ? "animate-pulse" : ""}`}
        style={{ background: `var(--nf-${kind})` }}
        aria-hidden="true"
      />
      {statusLabel(status)}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <div className="mt-6 flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 rounded-full" style={{ background: "var(--nf-surface-3)" }} />
        <div className="flex-1 pt-1">
          <div className="h-6 w-48 rounded" style={{ background: "var(--nf-surface-3)" }} />
          <div className="mt-2 h-3 w-32 rounded" style={{ background: "var(--nf-surface-2)" }} />
        </div>
      </div>
      <div className="mt-10 h-3 w-28 rounded" style={{ background: "var(--nf-surface-2)" }} />
      <div className="mt-4 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-3 w-12 shrink-0 rounded" style={{ background: "var(--nf-surface-2)" }} />
            <div className="h-4 flex-1 rounded" style={{ background: "var(--nf-surface-3)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
