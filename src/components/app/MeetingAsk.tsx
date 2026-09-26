"use client";

import { useState } from "react";
import { apiFetch, ApiError, type AskDTO, type TranscriptDTO } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { SparkleIcon, ChevronRightIcon } from "@/components/icons";

/**
 * Ask NoteFlow for a single meeting, redesigned as the workspace's integrated bottom composer
 * (Phase 3). Same POST /meetings/{id}/ask against the real transcript; citation chips resolve to
 * real segments and reuse seekTo — clicking one seeks + plays and the transcript highlights the
 * cited line. Integrated surface, not a floating chatbot.
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

  const chips =
    answer?.citations
      .map((id) => byId.get(id))
      .filter((s): s is TranscriptDTO["segments"][number] => Boolean(s))
      .sort((a, b) => a.start - b.start) ?? [];

  return (
    <div>
      {(loading || error || answer) && (
        <div className="mb-3 max-h-[38vh] overflow-y-auto rounded-xl p-3.5" style={{ background: "var(--nf-surface-2)", border: "1px solid var(--nf-hairline)" }}>
          {loading && (
            <p className="flex items-center gap-2 text-sm nf-t2">
              <SparkleIcon className="h-4 w-4 animate-pulse" />
              Reading the transcript…
            </p>
          )}
          {error && !loading && <p className="text-sm" style={{ color: "var(--nf-failed)" }}>{error}</p>}
          {answer && !loading && (
            <>
              <p className="text-sm leading-relaxed nf-t" dir="auto">{answer.answer}</p>
              {chips.length > 0 && (
                <div className="mt-3">
                  <span className="text-[11px] font-medium uppercase tracking-[0.13em] nf-tf">Cited moments</span>
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    {chips.map((seg) => (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => onSeek(seg.start)}
                        className="nf-row group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left"
                      >
                        <span className="shrink-0 font-mono text-[11px] tabular-nums nf-t2">{formatTimestamp(seg.start)}</span>
                        <span className="min-w-0 flex-1 truncate text-xs nf-t2" dir="auto">{seg.text}</span>
                        <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 nf-tm" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="nf-input flex items-center gap-2.5 px-4 py-3" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
        <SparkleIcon className="h-4 w-4 shrink-0 nf-tm" />
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
          className="min-w-0 flex-1 bg-transparent text-sm nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={loading || !question.trim()}
          className="nf-btn-primary shrink-0 px-3.5 py-1.5 text-xs disabled:opacity-50"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </div>
    </div>
  );
}
