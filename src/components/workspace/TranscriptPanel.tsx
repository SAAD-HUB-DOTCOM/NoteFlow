"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Speaker, TranscriptSegment } from "@/types/meeting";
import { usePlayback } from "@/lib/playback";
import { findActiveSegmentIndex } from "@/lib/transcript";
import { formatTimestamp, initialsFrom } from "@/lib/format";

/**
 * The transcript — the core synchronized surface (PLAN §4). The segment where
 * start <= currentTime < end is highlighted as playback moves; clicking any segment (or its
 * timestamp) seeks the player via the shared seekTo primitive; the active segment auto-scrolls
 * into view unless the user has just scrolled manually (then auto-scroll pauses briefly).
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

  const isEmpty = segments.length === 0;

  // Any manual scroll gesture pauses auto-scroll for a moment so we don't fight the reader.
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
    if (!el) return;

    const cTop = container.scrollTop;
    const cBottom = cTop + container.clientHeight;
    const eTop = el.offsetTop;
    const eBottom = eTop + el.offsetHeight;
    const fullyVisible = eTop >= cTop && eBottom <= cBottom;
    if (fullyVisible) return;

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

  return (
    <div
      ref={scrollRef}
      className="max-h-[calc(100vh-19rem)] min-h-[20rem] overflow-y-auto rounded-xl border border-border bg-surface/40 p-2 sm:p-3"
    >
      <ol className="space-y-0.5">
        {segments.map((seg, i) => {
          const speaker = speakerById.get(seg.speakerId);
          const name = speaker?.name ?? "Speaker";
          const initials = speaker?.initials ?? initialsFrom(name);
          const isActive = i === activeIndex;

          return (
            <li key={seg.id} data-seg={i}>
              <button
                type="button"
                onClick={() => seekTo(seg.start)}
                aria-current={isActive ? "true" : undefined}
                className={`flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActive ? "bg-surface-hover" : "hover:bg-surface/80"
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center self-start rounded-full bg-surface-hover text-[0.65rem] font-medium text-foreground/90 ring-1 ring-border/60">
                  {initials}
                </span>

                <span className="min-w-0 flex-1">
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
                  <span
                    className={`block text-sm leading-relaxed ${
                      isActive ? "text-foreground" : "text-foreground/75"
                    }`}
                  >
                    {seg.text}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
