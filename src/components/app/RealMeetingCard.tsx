import Link from "next/link";
import { Waveform } from "@/components/Waveform";
import { formatDuration } from "@/lib/format";
import type { MeetingDTO } from "@/lib/api";
import { StatusChip } from "@/components/app/StatusChip";

/**
 * A real captured meeting as a grid tile — mirrors the seeded MeetingThumb's look (waveform
 * silhouette + duration badge + title) but shows the true lifecycle status instead of a speaker
 * count, and links to the real workspace at /app/meetings/[id].
 */
export function RealMeetingCard({ meeting }: { meeting: MeetingDTO }) {
  return (
    <Link href={`/app/meetings/${meeting.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface transition-colors group-hover:border-primary/50">
        <div className="flex h-36 items-center px-5">
          <Waveform seed={meeting.id} bars={44} />
        </div>
        {meeting.duration_seconds != null && (
          <span className="absolute bottom-2.5 right-2.5 rounded-md bg-background/85 px-1.5 py-0.5 text-xs font-medium text-foreground">
            {formatDuration(meeting.duration_seconds)}
          </span>
        )}
      </div>
      <h3 className="mt-3 line-clamp-1 text-[0.95rem] font-medium text-foreground transition-colors group-hover:text-primary">
        {meeting.title || "Untitled meeting"}
      </h3>
      <div className="mt-1">
        <StatusChip status={meeting.status} />
      </div>
    </Link>
  );
}
