import Link from "next/link";
import { formatTimestamp } from "@/lib/format";
import { ChevronRightIcon } from "@/components/icons";

/**
 * The NoteFlow source-moment primitive (Phase 4): `Meeting title · 18:42 →`.
 * Every output — a highlight, an action item, a shared link — leads back to the conversation it
 * came from. Renders the real timestamp only when a segment resolves (never a fabricated one);
 * otherwise just the meeting. Links to the meeting workspace using existing navigation.
 */
export function SourceMoment({
  meetingId,
  meetingTitle,
  start,
  className = "",
}: {
  meetingId: string;
  meetingTitle: string;
  start: number | null;
  className?: string;
}) {
  return (
    <Link
      href={`/app/meetings/${meetingId}`}
      className={`group inline-flex max-w-full items-center gap-1.5 text-xs transition-colors ${className}`}
    >
      <span className="truncate nf-t2 transition-colors group-hover:text-[color:var(--nf-text)]">
        {meetingTitle}
      </span>
      {start != null && (
        <>
          <span className="nf-tf">·</span>
          <span className="shrink-0 font-mono tabular-nums nf-t2 transition-colors group-hover:text-[color:var(--nf-text)]">
            {formatTimestamp(start)}
          </span>
        </>
      )}
      <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 nf-tm transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
