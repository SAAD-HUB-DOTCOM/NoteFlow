import Link from "next/link";
import type { MeetingCardData } from "@/lib/dashboard";
import { Waveform } from "@/components/Waveform";
import { SpeakerStack } from "@/components/SpeakerStack";
import { ChevronRightIcon } from "@/components/icons";

/**
 * A meeting row. Not the lazy icon+heading+text card: it carries the recording (waveform +
 * duration), who was there (speaker stack), what it was about (2-line summary), when it
 * happened (time), and whether it needs attention (open follow-ups). The frame is consistent
 * across rows — Operate-mode trust — and the content does the differentiating. Separation is
 * border + surface, not shadow (design system).
 *
 * Links to /meeting/[id] — the workspace built in Phase 2. A minimal placeholder route keeps
 * the link from 404-ing in the meantime.
 */
export function MeetingCard({ card }: { card: MeetingCardData }) {
  return (
    <Link
      href={`/meeting/${card.id}`}
      className="group flex items-stretch gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover sm:gap-5 sm:p-5"
    >
      {/* Recording thumbnail: waveform in a recessed media well + duration */}
      <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-background px-2.5 py-3 sm:block sm:w-32">
        <Waveform seed={card.id} bars={24} />
        <span className="absolute bottom-1.5 left-1.5 rounded bg-background/80 px-1.5 py-0.5 text-xs font-medium text-foreground/90 backdrop-blur-sm">
          {card.durationLabel}
        </span>
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-base font-semibold text-foreground">
              {card.title}
            </h3>
            <span className="shrink-0 text-sm text-muted">{card.timeLabel}</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
            {card.summaryPreview}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SpeakerStack people={card.participants} />
            {/* Duration also shown here for the mobile layout where the thumbnail is hidden */}
            <span className="text-sm text-muted sm:hidden">{card.durationLabel}</span>
          </div>

          <div className="flex items-center gap-3">
            <AttentionPill openActions={card.openActions} />
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/70" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/** The at-a-glance "needs attention" signal: open follow-ups. Calm dot + label, not a loud badge. */
function AttentionPill({ openActions }: { openActions: number }) {
  if (openActions === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-2.5 py-1 text-sm text-foreground/80">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
      {openActions} to do
    </span>
  );
}
