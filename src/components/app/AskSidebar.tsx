"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type AskAllDTO, type MeetingDTO } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { SparkleIcon, ArrowUpIcon } from "@/components/icons";

const PROMPTS = [
  "What did I commit to this week?",
  "What's still open across my meetings?",
  "Summarize everything from today",
];

/**
 * Ask NoteFlow — account-level assistant that answers across the user's OWN recorded meetings
 * (POST /api/v1/ask), grounded in real transcripts. Citation chips link to the meeting at the
 * cited moment. Stays honestly empty until something has been recorded.
 */
export function AskSidebar() {
  const [hasMeetings, setHasMeetings] = useState(false);
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AskAllDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const meetings = await apiFetch<MeetingDTO[]>("/api/v1/meetings");
        setHasMeetings(meetings.length > 0);
      } catch {
        /* leave disabled; the field stays honestly inert if we can't confirm */
      }
    })();
  }, []);

  const submit = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q || loading) return;
      setLoading(true);
      setError(null);
      setAnswer(null);
      setAsked(q);
      try {
        const res = await apiFetch<AskAllDTO>("/api/v1/ask", {
          method: "POST",
          body: JSON.stringify({ question: q }),
        });
        setAnswer(res);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Couldn’t get an answer. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  return (
    <aside className="flex h-full flex-col border-l border-border bg-surface/30">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <SparkleIcon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Ask NoteFlow</h2>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-4 overflow-y-auto px-5 py-5">
        {!asked && (
          <>
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
                  disabled={!hasMeetings || loading}
                  onClick={() => void submit(p)}
                  className="rounded-2xl border border-border bg-surface px-3.5 py-2 text-right text-sm text-foreground/90 transition-colors enabled:hover:border-primary/50 enabled:hover:text-foreground disabled:opacity-60"
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {asked && (
          <div className="flex flex-col gap-3">
            <div className="self-end rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-white">
              {asked}
            </div>

            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <SparkleIcon className="h-4 w-4 animate-pulse text-primary" />
                Reading your meetings…
              </p>
            )}

            {error && !loading && <p className="text-sm text-danger">{error}</p>}

            {answer && !loading && (
              <div className="rounded-2xl rounded-bl-sm border border-border bg-surface px-3.5 py-3">
                <p className="text-sm leading-relaxed text-foreground/90">{answer.answer}</p>
                {answer.citations.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    <span className="text-xs text-muted">Cited moments:</span>
                    {answer.citations.map((c) => (
                      <Link
                        key={c.segment_id}
                        href={`/app/meetings/${c.meeting_id}`}
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs transition-colors hover:border-primary/50"
                      >
                        <span className="min-w-0 truncate text-foreground/90">{c.meeting_title}</span>
                        <span className="ml-auto shrink-0 font-mono tabular-nums text-primary">
                          {formatTimestamp(c.start)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <div className="rounded-xl border border-border bg-background/60 p-2.5">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(question);
                setQuestion("");
              }
            }}
            disabled={!hasMeetings}
            placeholder={hasMeetings ? "Ask anything…" : "Record a meeting to start asking"}
            aria-label="Ask NoteFlow"
            className="w-full bg-transparent px-1.5 py-1 text-sm text-foreground placeholder:text-muted focus:outline-none disabled:cursor-not-allowed"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted">
              My Meetings
            </span>
            <button
              type="button"
              onClick={() => {
                void submit(question);
                setQuestion("");
              }}
              disabled={!hasMeetings || loading || !question.trim()}
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
