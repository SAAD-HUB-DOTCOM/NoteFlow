"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Speaker, TranscriptSegment } from "@/types/meeting";
import { usePlayback } from "@/lib/playback";
import { findActiveSegmentIndex } from "@/lib/transcript";
import { formatTimestamp, initialsFrom } from "@/lib/format";
import { HighlightedText } from "@/components/HighlightedText";
import {
  SearchIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CloseIcon,
  BookmarkIcon,
  BookmarkFilledIcon,
} from "@/components/icons";

/**
 * The transcript — the core synchronized surface (PLAN §4). The active segment
 * (start <= currentTime < end) highlights and auto-scrolls during playback; clicking a segment
 * seeks via the shared seekTo primitive.
 *
 * Search: matches are term-highlighted; the counter + up/down (or Enter) step through hits by
 * reusing seekTo. Highlights (PLAN §3, Level 1.5): bookmark a moment (teal accent — the design
 * system reserves accent for highlights), then filter to just those moments and jump to any of
 * them with the same seekTo.
 */
export function TranscriptPanel({
  segments,
  participants,
}: {
  segments: TranscriptSegment[];
  participants: Speaker[];
}) {
  const { currentTime, isPlaying, seekTo } = usePlayback();
  const activeIndex = findActiveSegmentIndex(segments, currentTime);

  const speakerById = useMemo(() => {
    const map = new Map<string, Speaker>();
    for (const p of participants) map.set(p.id, p);
    return map;
  }, [participants]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pausedUntilRef = useRef(0);

  const [query, setQuery] = useState("");
  const [matchPos, setMatchPos] = useState(0);
  const [highlights, setHighlights] = useState<Set<string>>(new Set());
  const [highlightsOnly, setHighlightsOnly] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits: number[] = [];
    segments.forEach((s, i) => {
      if (s.text.toLowerCase().includes(q)) hits.push(i);
    });
    return hits;
  }, [segments, query]);

  const isEmpty = segments.length === 0;

  function goToMatch(pos: number) {
    if (matches.length === 0) return;
    const wrapped = (pos + matches.length) % matches.length;
    setMatchPos(wrapped);
    seekTo(segments[matches[wrapped]].start);
  }

  function toggleHighlight(id: string) {
    setHighlights((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Manual scroll gestures pause auto-scroll briefly so we don't fight the reader.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const markManual = () => {
      pausedUntilRef.current = performance.now() + 2500;
    };
    el.addEventListener("wheel", markManual, { passive: true });
    el.addEventListener("touchmove", markManual, { passive: true });
    return () => {
      el.removeEventListener("wheel", markManual);
      el.removeEventListener("touchmove", markManual);
    };
  }, []);

  // Auto-scroll the active segment into view when it changes during playback.
  useEffect(() => {
    if (activeIndex < 0 || !scrollRef.current) return;
    if (performance.now() < pausedUntilRef.current) return;
    const container = scrollRef.current;
    const el = container.querySelector<HTMLElement>(`[data-seg="${activeIndex}"]`);
    if (!el || el.offsetParent === null) return; // skip if hidden (e.g. highlights-only filter)

    const cTop = container.scrollTop;
    const cBottom = cTop + container.clientHeight;
    const eTop = el.offsetTop;
    const eBottom = eTop + el.offsetHeight;
    if (eTop >= cTop && eBottom <= cBottom) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    container.scrollTo({
      top: eTop - container.clientHeight / 2 + el.offsetHeight / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [activeIndex]);

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
        <p className="text-base font-medium text-foreground">No transcript yet</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
          This recording hasn’t been transcribed. Once it is, lines appear here in sync with
          playback.
        </p>
      </div>
    );
  }

  const hasQuery = query.trim().length > 0;
  const highlightCount = highlights.size;
  const showNoHighlights = highlightsOnly && highlightCount === 0;

  return (
    <div className="rounded-xl border border-border bg-surface/40">
      {/* Search + highlights controls */}
      <div className="flex items-center gap-2 border-b border-border p-2.5">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMatchPos(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                goToMatch(e.shiftKey ? matchPos - 1 : matchPos + 1);
              }
            }}
            placeholder="Search this transcript"
            aria-label="Search this transcript"
            className="w-full rounded-lg border border-border bg-background/60 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted transition-colors focus:border-primary focus:outline-none"
          />
        </div>

        {hasQuery && (
          <div className="flex items-center gap-1">
            <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-muted">
              {matches.length === 0 ? "0 results" : `${matchPos + 1} / ${matches.length}`}
            </span>
            <button
              type="button"
              onClick={() => goToMatch(matchPos - 1)}
              disabled={matches.length === 0}
              aria-label="Previous match"
              className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronUpIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToMatch(matchPos + 1)}
              disabled={matches.length === 0}
              aria-label="Next match"
              className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear transcript search"
              className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {highlightCount > 0 && (
          <button
            type="button"
            onClick={() => setHighlightsOnly((v) => !v)}
            aria-pressed={highlightsOnly}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm tabular-nums transition-colors ${
              highlightsOnly
                ? "border-accent/50 bg-accent/10 text-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            <BookmarkFilledIcon className="h-3.5 w-3.5 text-accent" />
            {highlightCount}
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="max-h-[calc(100vh-23rem)] min-h-[20rem] overflow-y-auto p-2 sm:p-3"
      >
        {showNoHighlights ? (
          <div className="px-4 py-14 text-center">
            <p className="text-sm font-medium text-foreground">No highlights yet</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
              Bookmark a moment with the icon on any line, then revisit it here.
            </p>
          </div>
        ) : (
          <ol className="space-y-0.5">
            {segments.map((seg, i) => {
              const speaker = speakerById.get(seg.speakerId);
              const name = speaker?.name ?? "Speaker";
              const initials = speaker?.initials ?? initialsFrom(name);
              const isActive = i === activeIndex;
              const isCurrentMatch = hasQuery && matches[matchPos] === i;
              const isHighlighted = highlights.has(seg.id);
              const hidden = highlightsOnly && !isHighlighted;

              const rowBg = isActive
                ? "bg-surface-hover"
                : isHighlighted
                  ? "bg-accent/5"
                  : isCurrentMatch
                    ? "bg-surface-hover/60"
                    : "hover:bg-surface/80";

              return (
                <li key={seg.id} data-seg={i} className={hidden ? "hidden" : undefined}>
                  <div className={`group flex items-start gap-1 rounded-lg ${rowBg}`}>
                    <button
                      type="button"
                      onClick={() => seekTo(seg.start)}
                      aria-current={isActive ? "true" : undefined}
                      className="flex min-w-0 flex-1 gap-3 rounded-lg px-3 py-2.5 text-left"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center self-start rounded-full bg-surface-hover text-[0.65rem] font-medium text-foreground/90 ring-1 ring-border/60">
                        {initials}
                      </span>

                      <span className="min-w-0 flex-1 max-w-[68ch]">
                        <span className="mb-0.5 flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              isActive ? "text-primary" : "text-foreground/90"
                            }`}
                          >
                            {name}
                          </span>
                          <span className="font-mono text-xs tabular-nums text-muted">
                            {formatTimestamp(seg.start)}
                          </span>
                          {isActive && isPlaying && (
                            <span className="flex items-end gap-0.5" aria-label="Now playing">
                              <span className="eq-bar" style={{ animationDelay: "0ms" }} />
                              <span className="eq-bar" style={{ animationDelay: "150ms" }} />
                              <span className="eq-bar" style={{ animationDelay: "300ms" }} />
                            </span>
                          )}
                        </span>
                        <HighlightedText
                          text={seg.text}
                          query={hasQuery ? query : ""}
                          className={`block text-sm leading-relaxed ${
                            isActive ? "text-foreground" : "text-foreground/75"
                          }`}
                        />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleHighlight(seg.id)}
                      aria-pressed={isHighlighted}
                      aria-label={isHighlighted ? "Remove highlight" : "Highlight this moment"}
                      className={`mr-1 mt-2 grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors hover:bg-surface-hover ${
                        isHighlighted
                          ? "text-accent"
                          : "text-muted/50 hover:text-foreground focus-visible:text-foreground"
                      }`}
                    >
                      {isHighlighted ? (
                        <BookmarkFilledIcon className="h-4 w-4" />
                      ) : (
                        <BookmarkIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
