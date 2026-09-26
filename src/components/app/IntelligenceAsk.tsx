"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type AskAllDTO } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { SparkleIcon, ChevronRightIcon } from "@/components/icons";

const PROMPTS = [
  "What did we decide about the launch?",
  "What changed about pricing?",
  "What am I responsible for?",
  "Where did we discuss onboarding?",
];

/**
 * Cross-meeting Ask as a research-query surface (Phase 5). Uses the real POST /api/v1/ask across
 * the user's own meetings; the answer transitions the same graphite surface into a research result
 * with real citations that lead back to the source meeting (existing navigation). Not a chatbot.
 */
export function IntelligenceAsk() {
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AskAllDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (raw: string) => {
    const question = raw.trim();
    if (!question || loading) return;
    setLoading(true); setError(null); setAnswer(null); setAsked(question);
    try {
      const res = await apiFetch<AskAllDTO>("/api/v1/ask", { method: "POST", body: JSON.stringify({ question }) });
      setAnswer(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t search your conversations. Try again.");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return (
    <section className="max-w-[820px]">
      <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] nf-tf">Ask across your conversations</h2>

      <div
        className="rounded-2xl p-2"
        style={{
          background: "linear-gradient(180deg, #141416 0%, #0e0e11 100%)",
          border: "1px solid var(--nf-border)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 22px 55px -34px rgba(0,0,0,0.65)",
        }}
      >
        <div className="flex items-center gap-2.5 px-2.5 py-1.5">
          <SparkleIcon className="h-[18px] w-[18px] shrink-0 nf-tm" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void submit(q); } }}
            placeholder="Ask across your conversations…"
            aria-label="Ask across your conversations"
            className="w-full bg-transparent text-[16px] tracking-[-0.01em] nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void submit(q)}
            disabled={loading || !q.trim()}
            className="nf-btn-primary shrink-0 px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Searching…" : "Ask"}
          </button>
        </div>

        {(loading || error || answer) && (
          <div className="border-t px-3.5 py-3.5" style={{ borderColor: "var(--nf-hairline)" }}>
            {asked && <p className="mb-3 text-xs nf-tm">{asked}</p>}
            {loading && (
              <p className="flex items-center gap-2 text-sm nf-t2">
                <SparkleIcon className="h-4 w-4 animate-pulse" />
                Searching your conversations…
              </p>
            )}
            {error && !loading && <p className="text-sm" style={{ color: "var(--nf-failed)" }}>{error}</p>}
            {answer && !loading && (
              <>
                <p className="text-[11px] font-medium uppercase tracking-[0.13em] nf-tf">Your answer</p>
                <p className="mt-2 text-[15px] leading-[1.72] nf-t" dir="auto">{answer.answer}</p>
                {answer.citations.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.13em] nf-tf">Sources</p>
                    <div className="mt-1.5 flex flex-col">
                      {answer.citations.map((c) => (
                        <Link
                          key={c.segment_id}
                          href={`/app/meetings/${c.meeting_id}`}
                          className="nf-row group flex items-center gap-3 rounded-md px-2 py-2"
                        >
                          <span className="shrink-0 font-mono text-[11px] tabular-nums nf-t2">{formatTimestamp(c.start)}</span>
                          <span className="min-w-0 flex-1 truncate text-[13px] nf-t" dir="auto">{c.meeting_title}</span>
                          <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 nf-tm transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {!asked && (
        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => void submit(p)}
              className="rounded-lg px-3 py-1.5 text-[13px] nf-t2 transition-colors hover:text-[color:var(--nf-text)]"
              style={{ border: "1px solid var(--nf-hairline)" }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
