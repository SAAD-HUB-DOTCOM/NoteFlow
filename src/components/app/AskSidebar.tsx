"use client";

import { SparkleIcon, ArrowUpIcon, ChevronDownIcon } from "@/components/icons";

const PROMPTS = [
  "What did I commit to this week?",
  "What's still open across my meetings?",
  "Summarize everything from today",
];

/**
 * Ask NoteFlow — the account-level assistant rail. It answers from your own recorded meetings,
 * so before anything is recorded it stays honestly empty: the prompts preview what you'll be
 * able to ask, and the field is disabled rather than pretending to respond.
 */
export function AskSidebar({ hasMeetings = false }: { hasMeetings?: boolean }) {
  return (
    <aside className="flex h-full flex-col border-l border-border bg-surface/30">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <SparkleIcon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Ask NoteFlow</h2>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-3 px-5 py-5">
        <p className="text-sm leading-relaxed text-muted">
          {hasMeetings
            ? "Ask anything across your recorded meetings — decisions, follow-ups, or a moment you half-remember."
            : "Once you've recorded a meeting, ask it anything here and get answers with the exact moment they were said."}
        </p>
        <div className="flex flex-col items-end gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={!hasMeetings}
              className="rounded-2xl border border-border bg-surface px-3.5 py-2 text-right text-sm text-foreground/90 transition-colors enabled:hover:border-primary/50 enabled:hover:text-foreground disabled:opacity-60"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="rounded-xl border border-border bg-background/60 p-2.5">
          <input
            type="text"
            disabled={!hasMeetings}
            placeholder={hasMeetings ? "Ask anything…" : "Record a meeting to start asking"}
            aria-label="Ask NoteFlow"
            className="w-full bg-transparent px-1.5 py-1 text-sm text-foreground placeholder:text-muted focus:outline-none disabled:cursor-not-allowed"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted">
              My Meetings
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </span>
            <button
              type="button"
              disabled={!hasMeetings}
              aria-label="Send"
              className="grid h-7 w-7 place-items-center rounded-md bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <ArrowUpIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
