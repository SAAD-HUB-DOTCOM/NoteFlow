"use client";

import { useState } from "react";
import { apiFetch, ApiError, type AskDTO, type TranscriptDTO } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { SparkleIcon, ArrowUpIcon } from "@/components/icons";

/**
 * Ask NoteFlow for a single meeting (Phase 8). Sends the question to POST /meetings/{id}/ask,
 * which answers only from that meeting's real transcript. Citation chips resolve to real segments
 * (already loaded here) and reuse the Phase 7 seekTo() — clicking one seeks + plays the recording,
 * and the transcript's existing currentTime effect highlights/scrolls the cited line.
 */
export function MeetingAsk({
  meetingId,
  segments,
  onSeek,
}: {
  meetingId: string;
  segments: TranscriptDTO["segments"];
  onSeek: (seconds: number) => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byId = new Map(segments.map((s) => [s.id, s]));

  const submit = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await apiFetch<AskDTO>(`/api/v1/meetings/${meetingId}/ask`, {
        method: "POST",
        body: JSON.stringify({ question: q }),
      });
      setAnswer(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t get an answer. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Only citations we can actually resolve + seek to (defensive against stale ids).
  const chips =
    answer?.citations
      .map((id) => byId.get(id))
      .filter((s): s is TranscriptDTO["segments"][number] => Boolean(s))
      .sort((a, b) => a.start - b.start) ?? [];

  return (
    <div className="mb-8 rounded-xl border border-border bg-surface/50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <SparkleIcon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Ask this meeting</h2>
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-2.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="Ask anything about this meeting…"
            aria-label="Ask about this meeting"
            className="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading || !question.trim()}
            aria-label="Ask"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <SparkleIcon className="h-4 w-4 animate-pulse text-primary" />
          Reading the transcript…
        </p>
      )}

      {error && !loading && <p className="mt-4 text-sm text-danger">{error}</p>}

      {answer && !loading && (
        <div className="mt-4">
          <p className="text-sm leading-relaxed text-foreground/90">{answer.answer}</p>
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted">Cited moments:</span>
              {chips.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => onSeek(seg.start)}
                  title={seg.text}
                  className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs tabular-nums text-foreground/90 transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {formatTimestamp(seg.start)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
