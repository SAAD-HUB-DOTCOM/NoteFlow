"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Tabbed workspace showcase (replaces the integrations constellation). Adapted from the
 * reference: split header (headline + one-sentence description left, primary CTA right),
 * centered pill tabs, and a large rounded panel with the tab's visual floating inside.
 * Translated to the theme (landing_design_skill.md): monochrome headline with white key nouns
 * over muted text, white active pill, and the panel uses the site's light-wave wallpaper
 * (assets/gradient.webp + dark scrim, the ShowcaseDeck idiom) instead of a tinted background.
 * The three visuals are NoteFlow's real Action items / People / Intelligence screens.
 */
const TABS = [
  {
    key: "Action items",
    src: "/assets/product-visual-1.webp",
    alt: "NoteFlow's Action items screen: tasks and decisions pulled from meetings, each with an owner, alongside a live call tile with per-speaker audio",
  },
  {
    key: "People",
    src: "/assets/product-visual-2.webp",
    alt: "NoteFlow's People screen: everyone identified across your conversations with meeting counts, and an AI summary of your last meetings with a person",
  },
  {
    key: "Intelligence",
    src: "/assets/product-visual-3.webp",
    alt: "NoteFlow's Intelligence screen: an AI feed of key points, action items, and decisions summarized from each meeting",
  },
];

export function ProductTabs() {
  const [active, setActive] = useState(0);

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        {/* header: headline + description left, primary CTA right; stacks on small screens */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-h2 font-medium leading-[1.08] tracking-[-0.02em] text-muted text-balance">
              All your <span className="text-foreground">action items</span>,{" "}
              <span className="text-foreground">people</span>, &amp;{" "}
              <span className="text-foreground">insights</span> in one place.
            </h2>
            <p className="mt-4 max-w-md text-p-regular leading-relaxed text-muted">
              See what happened across every conversation and what your team
              needs to do next.
            </p>
          </div>
          <Link
            href="/login"
            className="vsp-btn vsp-btn-solid group inline-flex h-[44px] shrink-0 items-center gap-2 self-start rounded-md px-6 text-sm font-medium tracking-[-0.01em]"
          >
            Start for free
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-[3px]"
              aria-hidden="true"
            >
              <path d="M9.75 4.75 13.25 8m0 0-3.5 3.25M13.25 8H2.75" />
            </svg>
          </Link>
        </div>

        {/* centered pill tabs; the active pill is white with a small sliver mark */}
        <div
          role="tablist"
          aria-label="NoteFlow workspace views"
          className="mt-14 flex flex-wrap items-center justify-center gap-2"
        >
          {TABS.map((t, i) => {
            const on = i === active;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`workspace-panel-${i}`}
                onClick={() => setActive(i)}
                className={`inline-flex h-10 items-center gap-2.5 rounded-lg px-4 text-sm font-medium transition-colors duration-300 ${
                  on
                    ? "bg-[#F2F2EF] text-[#0A0A0A]"
                    : "bg-white/[0.05] text-muted shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] hover:bg-white/[0.08] hover:text-foreground"
                }`}
              >
                {on && (
                  <span
                    aria-hidden="true"
                    className="h-4 w-1 rounded-full bg-black/20"
                  />
                )}
                {t.key}
              </button>
            );
          })}
        </div>

        {/* wallpaper panel: light-wave background with the active visual floating inside */}
        <div className="relative mt-8 overflow-hidden rounded-[24px] border border-white/10 shadow-2xl shadow-black/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/gradient.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-black/25" />

          {/* panels stacked in one grid cell so the height stays stable while tabs crossfade */}
          <div className="relative grid px-4 py-10 sm:px-10 sm:py-14 lg:px-16">
            {TABS.map((t, i) => {
              const on = i === active;
              return (
                <div
                  key={t.key}
                  id={`workspace-panel-${i}`}
                  role="tabpanel"
                  aria-hidden={!on}
                  className={`col-start-1 row-start-1 transition-all duration-500 ${
                    on
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-2 opacity-0"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.src}
                    alt={t.alt}
                    className="mx-auto h-auto w-full max-w-4xl drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
