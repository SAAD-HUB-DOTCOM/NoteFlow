"use client";

import { useState } from "react";
import Link from "next/link";
import { StarEyebrow } from "@/components/landing/StarEyebrow";
import { SparkleIcon, CheckIcon, SearchIcon } from "@/components/icons";

/**
 * Three-pillar feature switcher — DESIGN.md §2.10. Left: a vertical accordion of the product's
 * three pillars, each with its star eyebrow, body, and a gradient CTA in its hue. Right: a single
 * frame that cross-fades to the active pillar's vignette over a colored glow. Click-driven (a calm,
 * robust reading of Fathom's scroll-pinned original); the active pillar's body expands via a
 * grid-rows transition. This is the "3 pillars of the product" pattern — not a generic icon grid.
 */
type Hue = "cyan" | "yellow" | "pink";

type Pillar = {
  id: string;
  eyebrow: string;
  hue: Hue;
  title: string;
  body: string;
  glow: string;
  render: () => React.ReactNode;
};

const PILLARS: Pillar[] = [
  {
    id: "clarity",
    eyebrow: "Unforgettable meetings — literally",
    hue: "cyan",
    title: "Clarity",
    body: "Shockingly accurate transcripts, instant summaries, and action items at a consistent quality on every call — ready the moment you hang up.",
    glow: "rgba(0,190,255,0.4)",
    render: () => <ClarityVignette />,
  },
  {
    id: "momentum",
    eyebrow: "Less overhead, more done",
    hue: "yellow",
    title: "Momentum",
    body: "Ask NoteFlow anything across your meetings and get an answer with the exact moment it was said — so you spend less time searching and more time doing.",
    glow: "rgba(255,245,140,0.32)",
    render: () => <MomentumVignette />,
  },
  {
    id: "ease",
    eyebrow: "Works wherever you do",
    hue: "pink",
    title: "Ease",
    body: "Notes, insights, and action items sync automatically to the tools you already use — Slack, Notion, your CRM — without you lifting a finger.",
    glow: "rgba(255,168,187,0.34)",
    render: () => <EaseVignette />,
  },
];

const CTA_HUE: Record<Hue, string> = {
  cyan: "text-brand-cyan",
  yellow: "text-brand-yellow",
  pink: "text-brand-pink",
};

export function Pillars() {
  const [active, setActive] = useState(PILLARS[0].id);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_1.05fr] lg:items-center lg:gap-16">
      {/* left: accordion of pillars */}
      <div className="divide-y divide-border/70">
        {PILLARS.map((p) => {
          const open = p.id === active;
          return (
            <div key={p.id} className="py-5 first:pt-0">
              <button
                type="button"
                onClick={() => setActive(p.id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span className="font-display text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                  {p.title}
                </span>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors ${
                    open ? "border-transparent bg-foreground text-background" : "border-border text-muted"
                  }`}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${open ? "rotate-45" : ""}`} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>

              <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <div className="pt-4">
                    <StarEyebrow hue={p.hue}>{p.eyebrow}</StarEyebrow>
                    <p className="mt-3 max-w-md text-p-regular leading-relaxed text-muted">{p.body}</p>
                    <Link
                      href="/login"
                      className={`mt-5 inline-flex items-center gap-1.5 font-display text-sm font-semibold ${CTA_HUE[p.hue]} transition-opacity hover:opacity-80`}
                    >
                      Get started — it&apos;s free
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* right: cross-fading frame + colored glow */}
      <div className="relative">
        {PILLARS.map((p) => (
          <div
            key={p.id}
            aria-hidden="true"
            className={`nebula pointer-events-none absolute inset-6 -z-10 transition-opacity duration-500 ${p.id === active ? "opacity-100" : "opacity-0"}`}
            style={{ ["--nebula-color" as string]: p.glow }}
          />
        ))}
        <div className="relative grid overflow-hidden rounded-boxed border border-border bg-surface/70 shadow-2xl shadow-black/50 backdrop-blur-md ring-1 ring-white/5">
          {PILLARS.map((p) => (
            <div
              key={p.id}
              aria-hidden={p.id !== active}
              className={`col-start-1 row-start-1 p-6 transition-opacity duration-500 ease-out sm:p-8 ${
                p.id === active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {p.render()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- vignettes -- */

function ClarityVignette() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-brand-cyan">
        <SparkleIcon className="h-4 w-4" /> Summary · Weekly product planning
      </div>
      <ul className="space-y-2 text-[0.85rem] leading-relaxed text-foreground/90">
        <li>Dashboard UI ships Saturday; transcript view lands before Sunday.</li>
        <li>Team locked the dark launch theme early.</li>
        <li>Pricing stays usage-based with a free tier.</li>
      </ul>
      <div className="border-t border-border pt-3">
        <p className="text-xs font-medium text-muted">Action items</p>
        <div className="mt-2 space-y-1.5 text-[0.85rem] text-foreground/90">
          {["Finish dashboard UI — Saad", "Integrate transcript page — Lena"].map((a) => (
            <div key={a} className="flex items-center gap-2">
              <CheckIcon className="h-3.5 w-3.5 shrink-0 text-brand-cyan" /> {a}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MomentumVignette() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-2">
        <SearchIcon className="h-4 w-4 shrink-0 text-brand-yellow" />
        <span className="text-[0.82rem] text-muted">Ask across all meetings…</span>
      </div>
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-[0.82rem] text-white">
          When did we agree to ship the dashboard?
        </p>
      </div>
      <div className="flex gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-background text-brand-yellow">
          <SparkleIcon className="h-3.5 w-3.5" />
        </span>
        <div className="rounded-2xl rounded-bl-sm border border-border bg-background/60 px-3.5 py-2.5">
          <p className="text-[0.82rem] leading-relaxed text-foreground/90">Saturday 8 PM, in last week&apos;s planning call.</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-brand-yellow/15 px-2 py-0.5 text-[0.7rem] font-medium tabular-nums text-brand-yellow">
            Planning · 11:58
          </span>
        </div>
      </div>
    </div>
  );
}

function EaseVignette() {
  const tools = [
    { name: "Slack", note: "Recap posted to #product" },
    { name: "Notion", note: "Notes synced to the wiki" },
    { name: "HubSpot", note: "Call logged to the deal" },
  ];
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium text-muted">Sent automatically after the call</p>
      {tools.map((t) => (
        <div key={t.name} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3.5 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-pink/15 text-sm font-semibold text-brand-pink">
            {t.name[0]}
          </span>
          <div className="min-w-0">
            <p className="text-[0.85rem] font-medium text-foreground">{t.name}</p>
            <p className="truncate text-xs text-muted">{t.note}</p>
          </div>
          <span className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-pink/20">
            <CheckIcon className="h-3 w-3 text-brand-pink" />
          </span>
        </div>
      ))}
    </div>
  );
}
