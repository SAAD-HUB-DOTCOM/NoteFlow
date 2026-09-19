import Link from "next/link";
import type { MeetingSearchGroup, SearchResult } from "@/lib/search";
import { HighlightedText } from "@/components/HighlightedText";

/**
 * Cross-meeting search results, grouped by meeting (PLAN §4). Each result shows the content
 * match — a transcript quote with its timestamp, an action item, a summary line — not just a
 * title. Clicking a timestamped result opens the meeting and seeks to that moment via ?t=,
 * which the workspace resolves through the shared seekTo primitive.
 */
export function SearchResults({
  groups,
  query,
}: {
  groups: MeetingSearchGroup[];
  query: string;
}) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section
          key={group.meetingId}
          className="overflow-hidden rounded-xl border border-border bg-surface"
        >
          <Link
            href={`/meeting/${group.meetingId}`}
            className="block border-b border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
          >
            {group.meetingTitle}
          </Link>
          <ul>
            {group.results.map((result, i) => (
              <li key={i}>
                <ResultRow meetingId={group.meetingId} result={result} query={query} />
              </li>
            ))}
          </ul>
          {group.totalMatches > group.results.length && (
            <Link
              href={`/meeting/${group.meetingId}`}
              className="block px-4 py-2 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              +{group.totalMatches - group.results.length} more{" "}
              {group.totalMatches - group.results.length === 1 ? "match" : "matches"} in this
              meeting
            </Link>
          )}
        </section>
      ))}
    </div>
  );
}

const KIND_LABEL: Record<SearchResult["kind"], string> = {
  transcript: "Transcript",
  action: "Action item",
  summary: "Summary",
  participant: "Participant",
  title: "Title",
};

function ResultRow({
  meetingId,
  result,
  query,
}: {
  meetingId: string;
  result: SearchResult;
  query: string;
}) {
  const href =
    typeof result.start === "number"
      ? `/meeting/${meetingId}?t=${Math.floor(result.start)}`
      : `/meeting/${meetingId}`;

  return (
    <Link
      href={href}
      className="flex gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
    >
      <span className="w-16 shrink-0 pt-0.5">
        {result.timeLabel ? (
          <span className="font-mono text-xs tabular-nums text-primary">
            {result.timeLabel}
          </span>
        ) : (
          <span className="text-xs text-muted">{KIND_LABEL[result.kind]}</span>
        )}
      </span>
      <HighlightedText
        text={result.snippet}
        query={query}
        className="min-w-0 flex-1 text-sm leading-relaxed text-foreground/85"
      />
    </Link>
  );
}
