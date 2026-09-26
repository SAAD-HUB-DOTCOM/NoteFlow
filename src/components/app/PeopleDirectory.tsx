"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type PersonDTO } from "@/lib/api";
import { SearchIcon, ChevronRightIcon, UsersIcon } from "@/components/icons";
import { EmptyCard, ErrorCard, ListSkeleton } from "@/components/app/ActionItemsList";
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

/**
 * People directory (Phase 6D). People as an index into conversations, not a contacts database.
 * Only real, backend-derived data from GET /api/v1/people — conversation_count and
 * last_conversation_at are truthful; email/avatar render only when actually known; nothing about
 * role/org/topics is invented. Search operates over the real loaded fields (name + email) only.
 */
export function PeopleDirectory() {
  const [people, setPeople] = useState<PersonDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      setPeople(await apiFetch<PersonDTO[]>("/api/v1/people"));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load your people.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people ?? [];
    return (people ?? []).filter((p) =>
      `${p.display_name ?? ""} ${p.email ?? ""}`.toLowerCase().includes(q),
    );
  }, [people, query]);

  if (error) return <ErrorCard message={error} />;
  if (!people) return <ListSkeleton />;

  if (people.length === 0) {
    return (
      <EmptyCard
        icon={<UsersIcon className="h-5 w-5 nf-tm" />}
        title="No people yet"
        body="People appear here after meeting participants have been resolved to an identity. NoteFlow never invents a contact — it only shows who it can genuinely recognize across your conversations."
      />
    );
  }

  return (
    <div>
      <div className="nf-input flex items-center gap-2.5 px-4 py-2.5">
        <SearchIcon className="h-4 w-4 shrink-0 nf-tm" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people…"
          aria-label="Search people"
          className="w-full bg-transparent text-sm nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm nf-t2">No people match your search.</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-3 text-sm underline underline-offset-4 nf-t2 transition-colors hover:text-[color:var(--nf-text)]"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <h2 className="mt-8 text-[11px] font-medium uppercase tracking-[0.15em] nf-tf">Recent</h2>
          <ul className="mt-2 flex flex-col">
            {filtered.map((p, i) => {
              const date = shortDate(p.last_conversation_at);
              const meta = [conversationsLabel(p.conversation_count), date && `Last conversation ${date}`]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={p.id}>
                  {i > 0 && <div className="mx-2 border-t" style={{ borderColor: "var(--nf-hairline)" }} />}
                  <Link
                    href={`/app/people/${p.id}`}
                    className="nf-row group flex items-center gap-4 rounded-lg px-2 py-4"
                  >
                    <PersonMark displayName={p.display_name} email={p.email} avatarUrl={p.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium nf-t" dir="auto">
                        {personDisplayName(p)}
                      </p>
                      {/* Show the email as a secondary line only when it isn't already the name line. */}
                      {p.email && p.display_name?.trim() && (
                        <p className="truncate text-xs nf-tm" dir="auto">{p.email}</p>
                      )}
                      <p className="mt-1 text-xs nf-tm">{meta}</p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 nf-tm transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
