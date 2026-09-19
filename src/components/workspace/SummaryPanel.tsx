import type { MeetingSummary } from "@/types/meeting";

/**
 * The default summary template (PLAN §3 notes templates as a later feature; this is the base
 * one). Reading-focused: capped to a comfortable measure, generous line-height. The TL;DR
 * leads because research showed people scan the summary first (see the design-review meeting).
 */
export function SummaryPanel({ summary }: { summary: MeetingSummary }) {
  return (
    <div className="max-w-reading space-y-8">
      <p className="text-[0.95rem] leading-relaxed text-foreground">{summary.tldr}</p>

      {summary.keyPoints && summary.keyPoints.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Key points</h3>
          <ul className="space-y-2.5">
            {summary.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/85">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.sections?.map((section) => (
        <section key={section.heading}>
          <h3 className="mb-3 text-sm font-semibold text-foreground">{section.heading}</h3>
          <ul className="space-y-2.5">
            {section.points.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/85">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted"
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
