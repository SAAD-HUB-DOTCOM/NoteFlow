"use client";

import { useEffect, useRef, useState } from "react";
import {
  MicIcon,
  PlayIcon,
  ChecklistIcon,
  SparkleIcon,
  ShareIcon,
  CheckIcon,
} from "@/components/icons";

/**
 * Feature showcase adapted from Raycast's "Take shortcuts, not detours" section: a quiet
 * centered title, one framed screen showing a single product surface at a time, a dock that
 * switches the showcase, and a bold-lead caption naming what's on screen. Rebuilt for NoteFlow:
 * the five surfaces are the product's real ones (capture, transcript, summary, ask, share),
 * every mock shows what the app actually does, and the styling is the site's monochrome world —
 * hairline borders and flat surfaces instead of the reference's colored glow.
 *
 * The reel auto-advances until the visitor picks a surface themselves; it never auto-plays for
 * visitors who prefer reduced motion.
 */

type Surface = {
  id: string;
  label: string;
  icon: React.ReactNode;
  lead: string;
  caption: string;
  panel: React.ReactNode;
};

const SURFACES: Surface[] = [
  {
    id: "capture",
    label: "Capture",
    icon: <MicIcon className="h-4 w-4" />,
    lead: "Send the notetaker.",
    caption: "Paste a meeting link, or record in one click from the Chrome extension.",
    panel: <CapturePanel />,
  },
  {
    id: "transcript",
    label: "Transcript",
    icon: <PlayIcon className="h-4 w-4" />,
    lead: "Every word, timed.",
    caption: "Speaker-labeled lines that follow the recording as it plays.",
    panel: <TranscriptPanel />,
  },
  {
    id: "summary",
    label: "Summary",
    icon: <ChecklistIcon className="h-4 w-4" />,
    lead: "The recap writes itself.",
    caption: "Summary and action items are ready when the call ends.",
    panel: <SummaryPanel />,
  },
  {
    id: "ask",
    label: "Ask",
    icon: <SparkleIcon className="h-4 w-4" />,
    lead: "Ask your meetings.",
    caption: "Answers cite the exact moment they were said.",
    panel: <AskPanel />,
  },
  {
    id: "share",
    label: "Share",
    icon: <ShareIcon className="h-4 w-4" />,
    lead: "One link carries it.",
    caption: "Anyone you send it to can read the recap and transcript.",
    panel: <SharePanel />,
  },
];

export function ShowcaseDeck() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const manual = useRef(false);

  // Auto-advance the reel like the reference, but stop the moment the visitor takes over,
  // and never start for reduced-motion visitors.
  useEffect(() => {
    if (manual.current || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((i) => (i + 1) % SURFACES.length), 5500);
    return () => clearInterval(t);
  }, [paused, active]);

  const current = SURFACES[active];

  return (
    <div>
      {/* section title — small and quiet; the framed screen is the section's real subject */}
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
          Capture once, use it four ways.
        </h2>
        <p className="mt-1 text-xl font-normal tracking-[-0.02em] text-muted sm:text-2xl">
          The same recording becomes a transcript, a recap, and answers.
        </p>
      </div>

      {/* framed screen */}
      <div
        className="mt-12 overflow-hidden rounded-2xl border border-border bg-surface"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* app chrome */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="mx-auto hidden text-xs text-muted sm:block">
            noteflow.app / meeting / weekly-product-planning
          </span>
          <span className="hidden w-[54px] sm:block" aria-hidden="true" />
        </div>

        {/* showcase reel — panels crossfade in place */}
        <div className="relative h-[380px] sm:h-[360px]">
          {SURFACES.map((s, i) => (
            <div
              key={s.id}
              aria-hidden={i !== active}
              className={`absolute inset-0 grid place-items-center p-5 transition-opacity duration-300 ${
                i === active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {s.panel}
            </div>
          ))}
        </div>

        {/* dock */}
        <div className="flex items-center justify-center gap-1.5 border-t border-border px-4 py-3">
          {SURFACES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={s.label}
              aria-pressed={i === active}
              title={s.label}
              onClick={() => {
                manual.current = true;
                setActive(i);
              }}
              className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
                i === active
                  ? "bg-white/10 text-foreground"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              }`}
            >
              {s.icon}
            </button>
          ))}
        </div>
      </div>

      {/* caption for the active surface, in the reference's bold-lead pattern */}
      <p className="mx-auto mt-5 max-w-lg text-center text-p-small text-muted" aria-live="polite">
        <span className="font-medium text-foreground">{current.lead}</span> {current.caption}
      </p>
    </div>
  );
}

/* ---- panels: honest mocks of the five real surfaces ----------------------- */

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-background/60 p-4">
      <p className="text-xs font-medium text-muted">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function CapturePanel() {
  return (
    <Panel title="Record a meeting">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground/80">
          https://meet.google.com/abc-defg-hij
        </span>
        <span className="shrink-0 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">
          Send notetaker
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-muted">joining</span>
        <span className="text-muted/50">·</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-orange" />
          recording
        </span>
        <span className="text-muted/50">·</span>
        <span className="text-muted">ready</span>
      </div>
      <p className="mt-4 border-t border-border pt-3 text-sm leading-relaxed text-muted">
        On Google Meet, Zoom, or Teams the extension shows a Record button, so there is no link
        to paste at all.
      </p>
    </Panel>
  );
}

const WAVE = [40, 70, 45, 85, 60, 95, 50, 75, 100, 55, 80, 45, 65, 90, 40, 60, 75, 50, 85, 45];

function TranscriptPanel() {
  const lines = [
    { who: "Saad", t: "11:58", text: "Dashboard will be done Saturday by 8.", active: false },
    { who: "Priya", t: "12:01", text: "Then let's lock the launch theme today.", active: true },
    { who: "Lena", t: "12:04", text: "Transcript page goes in right after.", active: false },
  ];
  return (
    <Panel title="Transcript">
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground text-background">
          <PlayIcon className="h-3.5 w-3.5" />
        </span>
        <span className="flex h-6 flex-1 items-center gap-[3px]" aria-hidden="true">
          {WAVE.map((h, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full ${i < 9 ? "bg-white/70" : "bg-white/20"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted">12:01</span>
      </div>
      <div className="mt-3 space-y-1">
        {lines.map((l) => (
          <div
            key={l.t}
            className={`rounded-lg px-3 py-2 text-sm ${l.active ? "bg-white/[0.06]" : ""}`}
          >
            <span className="font-medium text-foreground">{l.who}</span>
            <span className="ml-2 text-xs tabular-nums text-muted">{l.t}</span>
            <p className="mt-0.5 leading-snug text-foreground/80">{l.text}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SummaryPanel() {
  return (
    <Panel title="Summary">
      <ul className="space-y-2 text-sm leading-relaxed text-foreground/85">
        <li>Dashboard ships Saturday; the transcript view follows on Sunday.</li>
        <li>The team locked the launch theme in the first ten minutes.</li>
      </ul>
      <p className="mt-4 text-xs font-medium text-muted">Action items</p>
      <div className="mt-2 space-y-2 text-sm text-foreground/85">
        <p className="flex items-center gap-2">
          <CheckIcon className="h-3.5 w-3.5 shrink-0 text-foreground/60" />
          Finish dashboard UI
          <span className="ml-auto text-xs text-muted">Saad · Sat</span>
        </p>
        <p className="flex items-center gap-2">
          <CheckIcon className="h-3.5 w-3.5 shrink-0 text-foreground/60" />
          Review transcript page
          <span className="ml-auto text-xs text-muted">Lena · Sun</span>
        </p>
      </div>
    </Panel>
  );
}

function AskPanel() {
  return (
    <Panel title="Ask NoteFlow">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-xl rounded-br-sm bg-white/10 px-3.5 py-2 text-sm text-foreground">
          What did I commit to this week?
        </p>
      </div>
      <div className="mt-3 max-w-[90%] rounded-xl rounded-bl-sm border border-border bg-surface px-3.5 py-2.5">
        <p className="text-sm leading-relaxed text-foreground/85">
          Two things: ship the dashboard by Saturday, and review the transcript page with Lena.
        </p>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-brand-cyan">
          <PlayIcon className="h-3 w-3" />
          Weekly product planning · 08:09
        </span>
      </div>
    </Panel>
  );
}

function SharePanel() {
  return (
    <Panel title="Share this meeting">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground/80">
          noteflow.app/share/weekly-product-planning
        </span>
        <span className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground">
          Copy link
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        The link opens the recap and full transcript in the browser. No NoteFlow account needed
        to read it.
      </p>
    </Panel>
  );
}
