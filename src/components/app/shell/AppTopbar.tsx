"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type AskAllDTO } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { RecordMeetingButton } from "@/components/app/RecordMeetingButton";
import { SearchIcon, SparkleIcon } from "@/components/icons";

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/**
 * Top utility bar — light, integrated into the canvas (no heavy toolbar background).
 * The global field is NoteFlow's Ask entry (POST /api/v1/ask across the user's real meetings);
 * results show inline with timestamp citations that open the meeting. Cross-meeting text/people
 * search is not a backend capability yet, so the field is scoped honestly to "ask".
 */
export function AppTopbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 shrink-0" style={{ background: "var(--nf-bg)" }}>
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-4 px-5 sm:px-8 lg:px-10">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="nf-btn-ghost grid h-9 w-9 shrink-0 place-items-center lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <GlobalAsk />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <RecordMeetingButton
            label="Capture"
            className="nf-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm"
          />
        </div>
      </div>
    </header>
  );
}

function GlobalAsk() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AskAllDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const submit = useCallback(async () => {
    const question = q.trim();
    if (!question || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setAsked(question);
    setOpen(true);
    try {
      const res = await apiFetch<AskAllDTO>("/api/v1/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
      });
      setAnswer(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t get an answer. Try again.");
    } finally {
      setLoading(false);
    }
  }, [q, loading]);

  return (
    <div ref={wrapRef} className="relative w-full max-w-[680px]">
      <div className="nf-input flex items-center gap-2.5 px-4 py-2.5">
        <SearchIcon className="h-4 w-4 shrink-0 nf-tm" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => asked && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="Ask across your meetings…"
          aria-label="Ask NoteFlow"
          className="w-full bg-transparent text-sm nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none"
        />
        <kbd
          className="hidden shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium nf-tm sm:inline-flex"
          style={{ border: "1px solid var(--nf-border)" }}
        >
          ⌘K
        </kbd>
      </div>

      {open && asked && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border shadow-2xl shadow-black/50"
          style={{ background: "var(--nf-surface-2)", borderColor: "var(--nf-border)" }}
        >
          <div className="border-b px-4 py-2.5 text-xs nf-tm" style={{ borderColor: "var(--nf-hairline)" }}>
            {asked}
          </div>
          <div className="max-h-[60vh] overflow-y-auto px-4 py-3.5">
            {loading && (
              <p className="flex items-center gap-2 text-sm nf-t2">
                <SparkleIcon className="h-4 w-4 animate-pulse" />
                Reading your meetings…
              </p>
            )}
            {error && !loading && <p className="text-sm" style={{ color: "var(--nf-failed)" }}>{error}</p>}
            {answer && !loading && (
              <>
                <p className="text-sm leading-relaxed nf-t">{answer.answer}</p>
                {answer.citations.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-wide nf-tf">Cited moments</span>
                    {answer.citations.map((c) => (
                      <Link
                        key={c.segment_id}
                        href={`/app/meetings/${c.meeting_id}`}
                        onClick={() => setOpen(false)}
                        className="nf-row flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs"
                        style={{ border: "1px solid var(--nf-border)" }}
                      >
                        <span className="min-w-0 flex-1 truncate nf-t">{c.meeting_title}</span>
                        <span className="shrink-0 font-mono tabular-nums nf-t2">{formatTimestamp(c.start)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
