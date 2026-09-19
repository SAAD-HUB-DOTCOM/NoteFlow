"use client";

import { useMemo, useState } from "react";
import type { MeetingSummary } from "@/types/meeting";
import { buildSummaryTemplates, type SummaryBlock } from "@/lib/summaryTemplates";
import { LayersIcon } from "@/components/icons";

/**
 * The summary, at reading width. A template switcher (PLAN §3, Level 1.5) swaps between
 * precomputed formats — Overview / Detailed / Bullets — of the same seeded content. Research
 * (see the design-review meeting) showed people scan the summary first, so the gist leads.
 */
export function SummaryPanel({ summary }: { summary: MeetingSummary }) {
  const templates = useMemo(() => buildSummaryTemplates(summary), [summary]);
  const [activeId, setActiveId] = useState(templates[0]?.id);
  const active = templates.find((t) => t.id === activeId) ?? templates[0];

  return (
    <div className="max-w-reading">
      {templates.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <LayersIcon className="h-4 w-4" />
            Template
          </span>
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            {templates.map((t) => {
              const selected = t.id === active.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  aria-pressed={selected}
                  className={`rounded-md px-3 py-1 text-sm transition-colors ${
                    selected
                      ? "bg-surface-hover text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {active.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </div>
  );
}

function Block({ block }: { block: SummaryBlock }) {
  if (block.kind === "paragraph") {
    return <p className="text-[0.95rem] leading-relaxed text-foreground">{block.text}</p>;
  }
  return (
    <section>
      {block.heading && (
        <h3 className="mb-3 text-sm font-semibold text-foreground">{block.heading}</h3>
      )}
      <ul className="space-y-2.5">
        {block.items?.map((point, i) => (
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
  );
}
