"use client";

import { useRef, useState } from "react";
import type { AskAnswer, Citation } from "@/types/meeting";
import { SparkleIcon, ArrowUpIcon, ClockIcon } from "@/components/icons";

/**
 * Ask NoteFlow (PLAN §4). For seeded meetings, answers are precomputed demo intelligence, not
 * live LLM output — and the UI says so, per the plan's "prototype honesty" note. Suggested
 * questions come from the meeting's seeded Q&A; typed questions are matched against that set by
 * keyword overlap, with an honest fallback when nothing matches. Every answer's timestamp
 * citations reuse the shared seekTo primitive to jump into the transcript.
 */
export function AskNoteFlow({
  askAnswers,
  onSeekTo,
}: {
  askAnswers: AskAnswer[];
  onSeekTo: (seconds: number) => void;
}) {
  type Msg = { id: number; role: "user" | "assistant"; text: string; citations?: Citation[] };
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const idRef = useRef(0);
  const nextId = () => ++idRef.current;

  function push(msg: Omit<Msg, "id">) {
    setMessages((m) => [...m, { ...msg, id: nextId() }]);
  }

  function askSeeded(qa: AskAnswer) {
    push({ role: "user", text: qa.question });
    push({ role: "assistant", text: qa.answer, citations: qa.citations });
  }

  function handleSubmit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    push({ role: "user", text: trimmed });
    const match = bestMatch(trimmed, askAnswers);
    if (match) {
      push({ role: "assistant", text: match.answer, citations: match.citations });
    } else {
      push({
        role: "assistant",
        text:
          "For seeded meetings, NoteFlow’s answers are precomputed rather than generated live, so I can only answer the prepared questions for this meeting. Try one of the suggestions below.",
      });
    }
  }

  const showSuggestions = messages.length === 0 || messages[messages.length - 1].role === "assistant";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-muted">
        <SparkleIcon className="h-4 w-4 text-primary" />
        Answers for seeded meetings are precomputed, not live AI.
      </div>

      {messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-surface-hover px-4 py-2.5 text-sm text-foreground">
                  {m.text}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15">
                  <SparkleIcon className="h-4 w-4 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-foreground">{m.text}</p>
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {m.citations.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onSeekTo(c.start)}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/50 hover:text-foreground"
                        >
                          <ClockIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="font-mono tabular-nums text-primary">
                            {formatClock(c.start)}
                          </span>
                          <span className="truncate text-muted">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {showSuggestions && askAnswers.length > 0 && (
        <div className="flex flex-col items-start gap-2">
          {messages.length === 0 && (
            <p className="text-sm text-muted">Ask about this meeting, or start with:</p>
          )}
          <div className="flex flex-wrap gap-2">
            {askAnswers.map((qa) => (
              <button
                key={qa.id}
                type="button"
                onClick={() => askSeeded(qa)}
                className="rounded-full border border-border bg-surface px-3.5 py-2 text-left text-sm text-foreground/85 transition-colors hover:border-primary/50 hover:bg-surface-hover"
              >
                {qa.question}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(input);
        }}
        className="relative"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this meeting…"
          aria-label="Ask NoteFlow"
          className="w-full rounded-lg border border-border bg-surface py-3 pl-4 pr-12 text-sm text-foreground placeholder:text-muted transition-colors focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send question"
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40 disabled:hover:bg-primary"
        >
          <ArrowUpIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Match a typed question to a seeded one by shared meaningful words. Accepts either two shared
 * words, or a single *rare* word — one that appears in only one seeded question (e.g.
 * "deadlines"), so unambiguous one-word cues still land on the right answer.
 */
function bestMatch(input: string, answers: AskAnswer[]): AskAnswer | null {
  const words = tokenize(input);
  if (words.size === 0) return null;

  const questionTokens = answers.map((qa) => tokenize(qa.question));
  const df = new Map<string, number>();
  for (const qt of questionTokens) for (const w of qt) df.set(w, (df.get(w) ?? 0) + 1);

  let best: AskAnswer | null = null;
  let bestScore = 0;
  let bestHasRare = false;
  answers.forEach((qa, i) => {
    let score = 0;
    let rare = false;
    for (const w of words) {
      if (questionTokens[i].has(w)) {
        score++;
        if ((df.get(w) ?? 0) === 1) rare = true;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = qa;
      bestHasRare = rare;
    }
  });

  if (bestScore >= 2) return best;
  if (bestScore === 1 && bestHasRare) return best;
  return null;
}

const STOP = new Set([
  "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "did", "do",
  "does", "is", "are", "was", "were", "we", "our", "about", "this", "that",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}
