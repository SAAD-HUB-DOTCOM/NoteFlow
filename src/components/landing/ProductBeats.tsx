"use client";

import { useState } from "react";
import { PlayIcon, SparkleIcon, CheckIcon, MicIcon } from "@/components/icons";

/**
 * Product beats slider — DESIGN.md §2.9. A short captioned run through the product: each beat is a
 * one-line caption (one clause gradient-clipped) above a framed product vignette. Yellow pagination
 * bullets + circular prev/next arrows, one authored slide transition. The vignettes are built from
 * design tokens so they read as the real app, not stock imagery.
 */
type Beat = {
  id: string;
  lead: string;
  accent: string; // the gradient-clipped clause
  tail?: string;
  render: () => React.ReactNode;
};

const BEATS: Beat[] = [
  {
    id: "capture",
    lead: "Record any call —",
    accent: "with a bot, or without one",
    render: () => <CaptureVignette />,
  },
  {
    id: "recap",
    lead: "Your recap is waiting",
    accent: "the second you hang up",
    render: () => <RecapVignette />,
  },
  {
    id: "ask",
    lead: "Ask any meeting a question,",
    accent: "even months later",
    render: () => <AskVignette />,
  },
  {
    id: "playback",
    lead: "Jump straight to the",
    accent: "exact moment it was said",
    render: () => <PlaybackVignette />,
  },
];

export function ProductBeats() {
  const [i, setI] = useState(0);
  const count = BEATS.length;
  const go = (n: number) => setI((n + count) % count);

  return (
    <div className="relative mx-auto max-w-3xl">
      {/* parallax-style gradient wash behind the frame */}
      <div
        aria-hidden="true"
        className="nebula pointer-events-none absolute inset-x-8 top-16 -z-10 h-72 opacity-60"
        style={{ ["--nebula-color" as string]: "rgba(150,0,255,0.35)" }}
      />

      <div className="min-h-[3.5rem] text-center">
        <p className="mx-auto max-w-xl text-balance font-display text-2xl font-normal leading-snug text-foreground sm:text-3xl">
          {BEATS[i].lead}{" "}
          <span className="font-semibold text-gradient-brand">{BEATS[i].accent}</span>
          {BEATS[i].tail ? ` ${BEATS[i].tail}` : ""}
        </p>
      </div>

      {/* the frame — overflow-hidden window that cross-fades the active vignette */}
      <div className="relative mt-8 overflow-hidden rounded-boxed border border-border bg-surface/70 shadow-2xl shadow-black/50 backdrop-blur-md ring-1 ring-white/5">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-yellow/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-cyan/70" />
        </div>
        <div className="grid">
          {BEATS.map((b, n) => (
            <div
              key={b.id}
              aria-hidden={n !== i}
              className={`col-start-1 row-start-1 p-5 transition-opacity duration-500 ease-out sm:p-7 ${
                n === i ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {b.render()}
            </div>
          ))}
        </div>
      </div>

      {/* controls: circular prev/next + yellow bullets (DESIGN.md §2.9) */}
      <div className="mt-7 flex items-center justify-center gap-5">
        <Arrow dir="prev" onClick={() => go(i - 1)} />
        <div className="flex items-center gap-2.5">
          {BEATS.map((b, n) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Go to beat ${n + 1}`}
              aria-current={n === i}
              className={`h-2.5 rounded-full bg-brand-yellow transition-all ${
                n === i ? "w-6 opacity-100" : "w-2.5 opacity-40 hover:opacity-70"
              }`}
            />
          ))}
        </div>
        <Arrow dir="next" onClick={() => go(i + 1)} />
      </div>
    </div>
  );
}

function Arrow({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous beat" : "Next beat"}
      className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/60 text-foreground transition-colors hover:border-brand-yellow/60 hover:text-brand-yellow"
    >
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${dir === "next" ? "" : "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </button>
  );
}

/* --------------------------------------------------------------- vignettes -- */

function VignetteHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-[0.95rem] font-semibold text-foreground">Weekly product planning</h3>
      <span className="text-xs text-muted">{children}</span>
    </div>
  );
}

function CaptureVignette() {
  const options = [
    { label: "Join with a bot", desc: "Visible participant, recording badge on", on: false, icon: <MicIcon className="h-4 w-4" /> },
    { label: "Record bot-free", desc: "Captures quietly in the background", on: true, icon: <SparkleIcon className="h-4 w-4" /> },
  ];
  return (
    <div>
      <VignetteHead>Zoom · 4 speakers</VignetteHead>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {options.map((o) => (
          <li
            key={o.label}
            data-border={o.on ? "gradient" : undefined}
            className={`rounded-xl border p-3.5 ${
              o.on ? "border-transparent bg-brand-purple/10" : "border-border bg-background/40"
            }`}
          >
            <div className="flex items-center gap-2 text-foreground">
              <span className={o.on ? "text-brand-purple" : "text-muted"}>{o.icon}</span>
              <span className="text-sm font-medium">{o.label}</span>
              {o.on && (
                <span className="ml-auto grid h-4 w-4 place-items-center rounded-full bg-brand-purple">
                  <CheckIcon className="h-3 w-3 text-white" />
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{o.desc}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecapVignette() {
  return (
    <div>
      <VignetteHead>Ended just now · 32 min</VignetteHead>
      <div className="mt-4 rounded-xl border border-border bg-background/40 p-3.5">
        <div className="flex items-center gap-2 text-xs font-medium text-brand-cyan">
          <SparkleIcon className="h-4 w-4" /> AI summary
        </div>
        <ul className="mt-2.5 space-y-2 text-[0.82rem] leading-relaxed text-foreground/90">
          <li>Dashboard UI ships Saturday; transcript view lands before Sunday.</li>
          <li>Team locked the dark launch theme in the first ten minutes.</li>
        </ul>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Finish dashboard — Saad, Sat", "Transcript page — Lena, Sun"].map((a) => (
          <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-foreground/85">
            <CheckIcon className="h-3.5 w-3.5 text-brand-cyan" />
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}

function AskVignette() {
  return (
    <div>
      <VignetteHead>Asked across 3 months</VignetteHead>
      <div className="mt-4 flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-[0.82rem] text-white">
          What did we decide about pricing back in July?
        </p>
      </div>
      <div className="mt-3 flex gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-background text-brand-purple">
          <SparkleIcon className="h-3.5 w-3.5" />
        </span>
        <div className="rounded-2xl rounded-bl-sm border border-border bg-background/60 px-3.5 py-2.5">
          <p className="text-[0.82rem] leading-relaxed text-foreground/90">
            You settled on usage-based pricing with a free tier.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-brand-purple/15 px-2 py-0.5 text-[0.7rem] font-medium tabular-nums text-brand-purple">
            Pricing sync · 14:22
          </span>
        </div>
      </div>
    </div>
  );
}

function PlaybackVignette() {
  const bars = [30, 55, 40, 70, 90, 60, 45, 80, 100, 65, 50, 75, 95, 55, 40, 60, 85, 45, 70, 50, 35, 60, 40, 55, 30, 45];
  return (
    <div>
      <VignetteHead>Playing · 12:04 / 32:00</VignetteHead>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-background/50 px-3 py-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-white">
          <PlayIcon className="h-4 w-4" />
        </span>
        <div className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden="true">
          {bars.map((h, n) => (
            <span key={n} className="w-[3px] rounded-full" style={{ height: `${h}%`, backgroundColor: n < 12 ? "#9600FF" : "#2A2A2A" }} />
          ))}
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted">12:04</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {[
          { who: "Priya", t: "12:01", text: "Let's lock the dark theme for launch.", active: false },
          { who: "Lena", t: "12:04", text: "Transcript page goes in right after.", active: true },
        ].map((l) => (
          <div key={l.t} className={`rounded-lg px-3 py-2 text-[0.8rem] ${l.active ? "bg-brand-purple/10" : ""}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-1.5 font-semibold text-brand-purple">
                {l.active && (
                  <span className="flex items-end gap-[2px]" aria-hidden="true">
                    <span className="eq-bar" />
                    <span className="eq-bar [animation-delay:0.2s]" />
                    <span className="eq-bar [animation-delay:0.4s]" />
                  </span>
                )}
                {l.who}
              </span>
              <span className="shrink-0 text-[0.7rem] tabular-nums text-muted">{l.t}</span>
            </div>
            <p className="mt-0.5 text-foreground/85">{l.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
