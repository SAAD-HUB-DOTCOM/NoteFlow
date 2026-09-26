"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MicIcon,
  ChecklistIcon,
  SparkleIcon,
  SearchIcon,
  ShareIcon,
} from "@/components/icons";

/**
 * "After the call" capability grid. Adapted from Attio's Signals feature grid (hairline-bordered
 * cells, small line icon at top, a short statement + a detail line at the bottom) — the structure,
 * spacing rhythm, and mobile-centered treatment are ported; Attio's conic-gradient orb, colored
 * badge, fake logo carousel and SDK/API block are dropped (they'd be decoration or untrue claims
 * here). Rebuilt in NoteFlow's restrained monochrome theme with real product capabilities only.
 */
type Cell = { icon: React.ReactNode; title: string; detail: string };

const CELLS: Cell[] = [
  {
    icon: <MicIcon className="size-5" />,
    title: "It records itself.",
    detail: "Joins Meet, Zoom, and Teams from a link, or one click in the extension.",
  },
  {
    icon: <ChecklistIcon className="size-5" />,
    title: "Every word, on the record.",
    detail: "A speaker-labeled transcript, kept in sync with the recording.",
  },
  {
    icon: <SparkleIcon className="size-5" />,
    title: "The recap is ready.",
    detail: "Summary, action items, and key moments by the time you hang up.",
  },
  {
    icon: <SearchIcon className="size-5" />,
    title: "Ask across every meeting.",
    detail: "Get the answer back with the exact moment it was said.",
  },
  {
    icon: <ShareIcon className="size-5" />,
    title: "Share it in a link.",
    detail: "Send a recap anyone can open. No NoteFlow account needed.",
  },
];

export function CaptureGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  // One quiet reveal when the grid enters — staggered per cell, reduced-motion safe.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="ask" className="relative scroll-mt-24 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        {/* editorial header — left aligned, two-tone heading (foreground + muted continuation) */}
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            After the call
          </p>
          <h2 className="mt-4 font-display text-h2 font-medium leading-[1.1] tracking-[-0.02em] text-foreground text-balance">
            What a meeting leaves behind,{" "}
            <span className="text-muted">without anyone taking notes.</span>
          </h2>
          <p className="mt-5 max-w-xl text-p-regular leading-relaxed text-muted">
            NoteFlow keeps the recording, the transcript, and the decisions from every call, and
            keeps them ready to search.
          </p>
          <Link
            href="/meeting/noteflow-product-planning"
            className="vsp-btn vsp-btn-ghost mt-7 inline-flex h-[38px] items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-medium tracking-[-0.01em]"
          >
            See a live recap
            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
            </svg>
          </Link>
        </div>

        {/* hairline-bordered capability grid (no cards): container carries top+left, cells carry
            right+bottom, so the rule lines stay clean at every column count. */}
        <div
          ref={gridRef}
          className="mt-14 grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 md:grid-cols-3 lg:mt-16 lg:grid-cols-5"
        >
          {CELLS.map((c, i) => (
            <div
              key={c.title}
              className={`flex flex-col justify-between gap-10 border-b border-r border-border px-6 py-8 transition-[opacity,transform] duration-500 ease-out max-lg:items-center max-lg:gap-5 max-lg:text-center lg:aspect-square lg:px-7 2xl:aspect-[5/4] ${
                shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
              style={{ transitionDelay: shown ? `${i * 70}ms` : "0ms" }}
            >
              <span className="text-muted" aria-hidden="true">
                {c.icon}
              </span>
              <div className="flex flex-col gap-1.5">
                <p className="text-balance text-[15px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground">
                  {c.title}
                </p>
                <p className="text-balance text-[13.5px] font-medium leading-[1.45] tracking-[-0.005em] text-muted">
                  {c.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
