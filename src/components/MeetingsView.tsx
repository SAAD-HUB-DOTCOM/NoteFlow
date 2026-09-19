"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import type { MeetingCardData } from "@/lib/dashboard";
import type { DateGroup } from "@/lib/format";
import { searchIndex, countMatches, type SearchEntry } from "@/lib/search";
import { MeetingCard } from "@/components/MeetingCard";
import { SearchResults } from "@/components/SearchResults";
import { Logo } from "@/components/Logo";
import { SearchIcon, MicIcon } from "@/components/icons";

const GROUP_ORDER: DateGroup[] = ["Today", "This week", "Earlier"];

export function MeetingsView({
  cards,
  totalOpenActions,
  searchEntries,
}: {
  cards: MeetingCardData[];
  totalOpenActions: number;
  searchEntries: SearchEntry[];
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses search, the way productivity tools train people to expect — but never while
  // the user is already typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim();
  const searchGroups = useMemo(
    () => (q ? searchIndex(searchEntries, q) : []),
    [searchEntries, q],
  );
  const resultCount = countMatches(searchGroups);

  const dateGroups = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      items: cards.filter((c) => c.group === group),
    })).filter((g) => g.items.length > 0);
  }, [cards]);

  const subtitle =
    cards.length === 0
      ? "No meetings yet"
      : `${cards.length} ${plural(cards.length, "recording")}, ${totalOpenActions} open ${plural(
          totalOpenActions,
          "follow-up",
        )}`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Logo />
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Recording capture arrives in a later milestone — meetings are seeded for now."
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-muted"
          >
            New recording
            <span className="rounded bg-background/70 px-1.5 py-0.5 text-[0.65rem] font-medium text-muted">
              Soon
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            My Meetings
          </h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
        </div>

        <div className="relative mb-8">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all meetings — people, summaries, transcripts"
            aria-label="Search meetings"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted transition-colors focus:border-primary focus:outline-none"
          />
          <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-muted sm:block">
            /
          </kbd>
        </div>

        {cards.length === 0 ? (
          <EmptyState />
        ) : q ? (
          searchGroups.length === 0 ? (
            <NoResults query={query} onClear={() => setQuery("")} />
          ) : (
            <div>
              <p className="mb-4 text-sm text-muted">
                {resultCount} {resultCount === 1 ? "match" : "matches"} across{" "}
                {searchGroups.length}{" "}
                {searchGroups.length === 1 ? "meeting" : "meetings"}
              </p>
              <SearchResults groups={searchGroups} query={query} />
            </div>
          )
        ) : (
          <div className="space-y-8">
            {dateGroups.map(({ group, items }) => (
              <section key={group}>
                <h2 className="mb-3 text-sm font-medium text-muted">{group}</h2>
                <div className="space-y-3">
                  {items.map((card) => (
                    <MeetingCard key={card.id} card={card} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}

/** No meetings at all — teach the interface rather than say "nothing here" (craft floor). */
function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-border bg-surface">
        <MicIcon className="h-5 w-5 text-muted" />
      </div>
      <p className="text-base font-medium text-foreground">No meetings yet</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
        Recorded meetings will show up here with their summary, transcript, and action items.
      </p>
    </div>
  );
}

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <p className="text-base font-medium text-foreground">
        No meetings match “{query}”
      </p>
      <p className="mt-1.5 text-sm text-muted">
        Try a different name, topic, or word from a summary.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Clear search
      </button>
    </div>
  );
}
