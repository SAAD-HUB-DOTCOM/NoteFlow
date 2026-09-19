"use client";

import { useState } from "react";
import type { ActionItem } from "@/types/meeting";
import { formatTimestamp } from "@/lib/format";
import { ClockIcon } from "@/components/icons";

/**
 * The Action Items panel — deliberately the strict surface (PLAN §1): only follow-ups people
 * actually committed to. Each item can be checked off (local state), shows its owner, and — when
 * it maps to a moment — links back into the recording via the shared seek primitive.
 */
export function ActionItemsPanel({
  items,
  onSeekTo,
}: {
  items: ActionItem[];
  onSeekTo: (seconds: number) => void;
}) {
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.completed])),
  );

  if (items.length === 0) {
    return (
      <div className="max-w-reading rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
        <p className="text-base font-medium text-foreground">No action items</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
          Nothing was committed to in this meeting. Anything softer worth following up on lives
          in Ask NoteFlow.
        </p>
      </div>
    );
  }

  const openCount = items.filter((i) => !done[i.id]).length;

  return (
    <div className="max-w-reading">
      <p className="mb-4 text-sm text-muted">
        {openCount === 0
          ? "All action items complete."
          : `${openCount} of ${items.length} still open.`}
      </p>
      <ul className="space-y-2">
        {items.map((item) => {
          const isDone = done[item.id];
          return (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3.5"
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => setDone((d) => ({ ...d, [item.id]: !d[item.id] }))}
                aria-label={`Mark "${item.text}" ${isDone ? "not done" : "done"}`}
                style={{ accentColor: "#00D9C0" }}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm leading-relaxed ${
                    isDone ? "text-muted line-through" : "text-foreground"
                  }`}
                >
                  {item.text}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {item.owner && (
                    <span className="text-xs text-muted">{item.owner}</span>
                  )}
                  {typeof item.start === "number" && (
                    <button
                      type="button"
                      onClick={() => onSeekTo(item.start as number)}
                      className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary-hover"
                    >
                      <ClockIcon className="h-3.5 w-3.5" />
                      Jump to {formatTimestamp(item.start)}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
