import Link from "next/link";
import { Waveform } from "@/components/Waveform";
import type { MeetingCardData } from "@/lib/dashboard";

/**
 * A meeting as a grid tile: the recording's own waveform silhouette on a dark thumbnail with a
 * duration badge, then the title — the reference's card, in NoteFlow's palette (indigo capture,
 * not a warm gradient). The waveform is the real object, seeded from the meeting id.
 */
export function MeetingThumb({ card }: { card: MeetingCardData }) {
  return (
    <Link href={`/meeting/${card.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface transition-colors group-hover:border-primary/50">
        <div className="flex h-36 items-center px-5">
          <Waveform seed={card.id} bars={44} />
        </div>
        <span className="absolute bottom-2.5 right-2.5 rounded-md bg-background/85 px-1.5 py-0.5 text-xs font-medium text-foreground">
          {card.durationLabel}
        </span>
      </div>
      <h3 className="mt-3 line-clamp-1 text-[0.95rem] font-medium text-foreground transition-colors group-hover:text-primary">
        {card.title}
      </h3>
      <p className="mt-1 text-xs text-muted">
        {card.speakerCount} {card.speakerCount === 1 ? "speaker" : "speakers"}
      </p>
    </Link>
  );
}
