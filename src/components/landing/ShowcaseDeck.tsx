"use client";

import { useEffect, useState } from "react";
import {
  MicIcon,
  PlayIcon,
  ChecklistIcon,
  SparkleIcon,
  ShareIcon,
  CheckIcon,
} from "@/components/icons";

/**
 * Feature showcase adapted from Raycast's "Take shortcuts, not detours" section, upgraded to a
 * self-playing product demo: a gradient backdrop glows through frosted panels, faint stars sit
 * around the frame, a menu bar caps the card, and each scene ANIMATES like a screen recording —
 * the capture URL types itself, the transcript plays, the summary streams in, Ask sends and
 * answers, and a cursor clicks Copy link. Scenes auto-advance like a video reel; the dock both
 * reflects and controls the playhead (the active item lifts).
 *
 * Every scene shows only what the product really does. Reduced-motion visitors get the finished
 * frame of each scene with manual dock switching and no autoplay.
 */

/* ---- animation primitives -------------------------------------------------- */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return reduced;
}

/** Phase counter: how many of `cues` (ms from scene start) have elapsed. */
function useTimeline(active: boolean, instant: boolean, cues: number[]) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!active) {
      setPhase(0);
      return;
    }
    if (instant) {
      setPhase(cues.length);
      return;
    }
    setPhase(0);
    const timers = cues.map((t, i) => setTimeout(() => setPhase(i + 1), t));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, instant]);
  return phase;
}

/** Typewriter: reveals `text` character by character once `go` is true. */
function useType(text: string, go: boolean, instant: boolean, speed = 28, delay = 0) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!go) {
      setN(0);
      return;
    }
    if (instant) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    let iv: ReturnType<typeof setInterval>;
    const st = setTimeout(() => {
      iv = setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length) clearInterval(iv);
      }, speed);
    }, delay);
    return () => {
      clearTimeout(st);
      if (iv!) clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, instant, text]);
  return { out: text.slice(0, n), done: n >= text.length };
}

/** 0→1 progress over `duration` ms while active (drives the waveform playhead). */
function useProgress(active: boolean, instant: boolean, duration: number) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!active) {
      setP(0);
      return;
    }
    if (instant) {
      setP(1);
      return;
    }
    setP(0);
    const t0 = performance.now();
    const iv = setInterval(() => {
      const v = Math.min(1, (performance.now() - t0) / duration);
      setP(v);
      if (v >= 1) clearInterval(iv);
    }, 80);
    return () => clearInterval(iv);
  }, [active, instant, duration]);
  return p;
}

const Caret = () => (
  <span className="sc-caret ml-[1px] inline-block h-[1.05em] w-[1.5px] translate-y-[2px] bg-foreground/90" />
);

/* ---- scene registry --------------------------------------------------------- */

type Scene = {
  id: string;
  label: string;
  icon: React.ReactNode;
  lead: string;
  caption: string;
  duration: number; // ms the scene plays before the reel advances
  Panel: React.ComponentType<{ active: boolean; instant: boolean }>;
};

const SCENES: Scene[] = [
  {
    id: "capture",
    label: "Capture",
    icon: <MicIcon className="h-4 w-4" />,
    lead: "Send the notetaker.",
    caption: "Paste a meeting link, or record in one click from the Chrome extension.",
    duration: 7200,
    Panel: CapturePanel,
  },
  {
    id: "transcript",
    label: "Transcript",
    icon: <PlayIcon className="h-4 w-4" />,
    lead: "Every word, timed.",
    caption: "Speaker-labeled lines that follow the recording as it plays.",
    duration: 7000,
    Panel: TranscriptPanel,
  },
  {
    id: "summary",
    label: "Summary",
    icon: <ChecklistIcon className="h-4 w-4" />,
    lead: "The recap writes itself.",
    caption: "Summary and action items are ready when the call ends.",
    duration: 7600,
    Panel: SummaryPanel,
  },
  {
    id: "ask",
    label: "Ask",
    icon: <SparkleIcon className="h-4 w-4" />,
    lead: "Ask your meetings.",
    caption: "Answers cite the exact moment they were said.",
    duration: 8600,
    Panel: AskPanel,
  },
  {
    id: "share",
    label: "Share",
    icon: <ShareIcon className="h-4 w-4" />,
    lead: "One link carries it.",
    caption: "Anyone you send it to can read the recap and transcript.",
    duration: 5600,
    Panel: SharePanel,
  },
];

/* ---- stars around the frame (deterministic, so SSR and client agree) -------- */

function makeStars(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => ({
    left: `${(rand() * 100).toFixed(2)}%`,
    top: `${(rand() * 100).toFixed(2)}%`,
    opacity: 0.1 + rand() * 0.3,
    twinkle: i % 9 === 0,
    delay: `${(rand() * 3.5).toFixed(2)}s`,
  }));
}
const STARS = makeStars(64, 260919);

function FrameStars() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-10 sm:-inset-16">
      {STARS.map((st, i) => (
        <span
          key={i}
          className={`absolute h-px w-px rounded-full bg-white ${st.twinkle ? "sc-twinkle" : ""}`}
          style={{
            left: st.left,
            top: st.top,
            opacity: st.opacity,
            ["--o" as string]: st.opacity,
            animationDelay: st.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ---- deck -------------------------------------------------------------------- */

export function ShowcaseDeck() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Video-style reel: each scene holds for its own duration, then the next begins.
  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(
      () => setActive((i) => (i + 1) % SCENES.length),
      SCENES[active].duration,
    );
    return () => clearTimeout(t);
  }, [active, paused, reduced]);

  const current = SCENES[active];

  return (
    <div>
      {/* section title — small and quiet; the playing frame is the section's subject */}
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
          Capture once, use it four ways.
        </h2>
        <p className="mt-1 text-xl font-normal tracking-[-0.02em] text-muted sm:text-2xl">
          The same recording becomes a transcript, a recap, and answers.
        </p>
      </div>

      <div className="relative mt-14">
        <FrameStars />

        {/* framed screen — the gradient lives inside it and glows through the frosted layers */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <img
            src="/assets/gradient.webp"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 w-[1300px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-80"
          />

          {/* menu bar, macOS-style — NoteFlow as the frontmost app */}
          <div className="relative flex items-center justify-between border-b border-white/10 bg-black/25 px-4 py-1.5 text-xs text-white/45 backdrop-blur-xl">
            <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap">
              <span className="font-semibold text-white/60">NoteFlow</span>
              {["File", "Edit", "View", "Meeting", "Window", "Help"].map((m) => (
                <span key={m} className="hidden sm:inline">
                  {m}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" aria-hidden="true">
                <path d="M2 6.5a8.5 8.5 0 0 1 12 0M4.3 9a5.2 5.2 0 0 1 7.4 0M6.6 11.4a2 2 0 0 1 2.8 0" />
                <circle cx="8" cy="13.4" r="0.7" fill="currentColor" stroke="none" />
              </svg>
              <svg viewBox="0 0 20 12" className="h-3 w-5" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
                <rect x="1" y="1.5" width="15" height="9" rx="2.5" />
                <rect x="2.8" y="3.3" width="9" height="5.4" rx="1.2" fill="currentColor" stroke="none" />
                <path d="M17.6 4.5v3" strokeLinecap="round" />
              </svg>
              <span className="hidden tabular-nums sm:inline">Fri Sep 26  9:41 AM</span>
            </div>
          </div>

          {/* reel */}
          <div className="relative h-[400px] sm:h-[380px]">
            {SCENES.map((s, i) => (
              <div
                key={s.id}
                aria-hidden={i !== active}
                className={`absolute inset-0 grid place-items-center p-5 transition-opacity duration-300 ${
                  i === active ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <s.Panel active={i === active} instant={reduced} />
              </div>
            ))}
          </div>

          {/* dock — the playhead; the active item lifts */}
          <div className="relative flex items-center justify-center gap-1.5 border-t border-white/10 bg-black/25 px-4 py-3 backdrop-blur-xl">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={s.label}
                aria-pressed={i === active}
                title={s.label}
                onClick={() => setActive(i)}
                className={`grid h-9 w-9 place-items-center rounded-lg transition-all duration-300 ${
                  i === active
                    ? "-translate-y-1 scale-110 bg-white/15 text-foreground shadow-lg shadow-black/40"
                    : "text-muted hover:bg-white/5 hover:text-foreground"
                }`}
              >
                {s.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* caption for the active scene, in the reference's bold-lead pattern */}
      <p className="mx-auto mt-6 max-w-lg text-center text-p-small text-muted" aria-live="polite">
        <span className="font-medium text-foreground">{current.lead}</span> {current.caption}
      </p>
    </div>
  );
}

/* ---- shared panel shell ------------------------------------------------------ */

function Glass({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-xl border border-white/10 bg-black/45 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl">
      <p className="text-xs font-medium text-white/50">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/* ---- scene 1 · capture: the URL types itself, then the bot joins ------------- */

const MEET_URL = "https://meet.google.com/abc-defg-hij";

function CapturePanel({ active, instant }: { active: boolean; instant: boolean }) {
  // cues: typing finishes ~2.2s → press → joining → recording → ready
  const phase = useTimeline(active, instant, [2350, 3100, 4300, 5900]);
  const { out: url } = useType(MEET_URL, active, instant, 42, 500);

  const Step = ({ on, label, dot }: { on: boolean; label: string; dot?: "rec" | "ok" }) => (
    <span
      className={`inline-flex items-center gap-1.5 transition-colors duration-300 ${
        on ? "font-medium text-foreground" : "text-white/40"
      }`}
    >
      {on && dot === "rec" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-orange" />
      )}
      {on && dot === "ok" && <CheckIcon className="h-3.5 w-3.5 text-white/80" />}
      {label}
    </span>
  );

  return (
    <Glass title="Record a meeting">
      <div className="flex items-center gap-2">
        <span className="flex min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground/85">
          {url || <span className="text-white/35">Paste a meeting link</span>}
          {active && phase < 1 && <Caret />}
        </span>
        <span
          className={`shrink-0 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-transform duration-200 ${
            phase === 1 ? "scale-95" : ""
          }`}
        >
          Send notetaker
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm">
        <Step on={phase >= 2 && phase < 3} label="joining" />
        <span className="text-white/25">·</span>
        <Step on={phase >= 3 && phase < 4} label="recording" dot="rec" />
        <span className="text-white/25">·</span>
        <Step on={phase >= 4} label="ready" dot="ok" />
      </div>
      <p className="mt-4 border-t border-white/10 pt-3 text-sm leading-relaxed text-white/50">
        On Google Meet, Zoom, or Teams the extension shows a Record button, so there is no link
        to paste at all.
      </p>
    </Glass>
  );
}

/* ---- scene 2 · transcript: the recording plays and lines light up ------------ */

const WAVE = [40, 70, 45, 85, 60, 95, 50, 75, 100, 55, 80, 45, 65, 90, 40, 60, 75, 50, 85, 45, 70, 55];
const LINES = [
  { who: "Saad", t: "11:58", text: "Dashboard will be done Saturday by 8." },
  { who: "Priya", t: "12:01", text: "Then let's lock the launch theme today." },
  { who: "Lena", t: "12:04", text: "Transcript page goes in right after." },
];

function TranscriptPanel({ active, instant }: { active: boolean; instant: boolean }) {
  const progress = useProgress(active, instant, 6200);
  const played = Math.floor(progress * WAVE.length);
  const activeLine = Math.min(LINES.length - 1, Math.floor(progress * LINES.length));

  return (
    <Glass title="Transcript">
      <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/40 px-3 py-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground text-background">
          <PlayIcon className="h-3.5 w-3.5" />
        </span>
        <span className="flex h-6 flex-1 items-center gap-[3px]" aria-hidden="true">
          {WAVE.map((h, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full transition-colors duration-200 ${
                i < played ? "bg-white/75" : "bg-white/20"
              }`}
              style={{ height: `${h}%` }}
            />
          ))}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-white/45">
          {LINES[activeLine].t}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        {LINES.map((l, i) => (
          <div
            key={l.t}
            className={`rounded-lg px-3 py-2 text-sm transition-colors duration-300 ${
              i === activeLine ? "bg-white/[0.08]" : ""
            }`}
          >
            <span className="font-medium text-foreground">{l.who}</span>
            <span className="ml-2 text-xs tabular-nums text-white/40">{l.t}</span>
            <p className="mt-0.5 leading-snug text-foreground/75">{l.text}</p>
          </div>
        ))}
      </div>
    </Glass>
  );
}

/* ---- scene 3 · summary: the recap streams in, then action items land --------- */

const BULLET_1 = "Dashboard ships Saturday; the transcript view follows on Sunday.";
const BULLET_2 = "The team locked the launch theme in the first ten minutes.";

function SummaryPanel({ active, instant }: { active: boolean; instant: boolean }) {
  const b1 = useType(BULLET_1, active, instant, 22, 400);
  const b2 = useType(BULLET_2, active && b1.done, instant, 22, 250);
  const phase = useTimeline(active, instant, [4600, 5300, 6000]);

  const Item = ({ on, text, meta }: { on: boolean; text: string; meta: string }) => (
    <p
      className={`flex items-center gap-2 text-sm text-foreground/85 transition-all duration-400 ${
        on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-white/70" />
      {text}
      <span className="ml-auto text-xs text-white/45">{meta}</span>
    </p>
  );

  return (
    <Glass title="Summary">
      <ul className="min-h-[68px] space-y-2 text-sm leading-relaxed text-foreground/85">
        <li>
          {b1.out}
          {active && !b1.done && <Caret />}
        </li>
        <li>
          {b2.out}
          {active && b1.done && !b2.done && <Caret />}
        </li>
      </ul>
      <p
        className={`mt-4 text-xs font-medium text-white/50 transition-opacity duration-300 ${
          phase >= 1 ? "opacity-100" : "opacity-0"
        }`}
      >
        Action items
      </p>
      <div className="mt-2 space-y-2">
        <Item on={phase >= 2} text="Finish dashboard UI" meta="Saad · Sat" />
        <Item on={phase >= 3} text="Review transcript page" meta="Lena · Sun" />
      </div>
    </Glass>
  );
}

/* ---- scene 4 · ask: the question sends, the answer streams, the cite lands --- */

const QUESTION = "What did I commit to this week?";
const ANSWER =
  "Two things: ship the dashboard by Saturday, and review the transcript page with Lena.";

function AskPanel({ active, instant }: { active: boolean; instant: boolean }) {
  const q = useType(QUESTION, active, instant, 34, 400);
  // send → thinking → answer starts → citation
  const phase = useTimeline(active, instant, [2000, 2900, 7300]);
  const a = useType(ANSWER, active && phase >= 2, instant, 24, 0);

  return (
    <Glass title="Ask NoteFlow">
      {/* input, until the question is sent */}
      {phase < 1 ? (
        <div className="flex items-center rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground/85">
          {q.out || <span className="text-white/35">Ask anything…</span>}
          {active && <Caret />}
        </div>
      ) : (
        <div className="flex justify-end">
          <p className="max-w-[85%] rounded-xl rounded-br-sm bg-white/12 px-3.5 py-2 text-sm text-foreground">
            {QUESTION}
          </p>
        </div>
      )}

      <div className="mt-3 min-h-[92px]">
        {phase >= 1 && phase < 2 && (
          <span className="inline-flex items-center gap-1.5 rounded-xl rounded-bl-sm border border-white/10 bg-black/40 px-3.5 py-2.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </span>
        )}
        {phase >= 2 && (
          <div className="max-w-[92%] rounded-xl rounded-bl-sm border border-white/10 bg-black/40 px-3.5 py-2.5">
            <p className="text-sm leading-relaxed text-foreground/85">
              {a.out}
              {active && !a.done && <Caret />}
            </p>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-xs text-brand-cyan transition-all duration-300 ${
                phase >= 3 ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
              }`}
            >
              <PlayIcon className="h-3 w-3" />
              Weekly product planning · 08:09
            </span>
          </div>
        )}
      </div>
    </Glass>
  );
}

/* ---- scene 5 · share: a cursor glides to Copy link and clicks ---------------- */

function SharePanel({ active, instant }: { active: boolean; instant: boolean }) {
  // cursor appears → travels → click (press) → "Copied"
  const phase = useTimeline(active, instant, [700, 2100, 2400]);
  const copied = phase >= 3;

  return (
    <Glass title="Share this meeting">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground/80">
          noteflow.app/share/weekly-product-planning
        </span>
        <span className="relative shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${
              copied
                ? "border-white/25 bg-white/10 text-foreground"
                : "border-white/15 text-foreground"
            } ${phase === 2 ? "scale-95" : ""}`}
          >
            {copied && <CheckIcon className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </span>
          {/* the demo cursor */}
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`absolute left-1/2 top-1/2 h-5 w-5 transition-all duration-[1100ms] ease-out ${
              phase >= 1 ? "opacity-100" : "opacity-0"
            }`}
            style={{
              transform:
                phase >= 2
                  ? "translate(-2px, -2px)"
                  : "translate(96px, 78px)",
            }}
          >
            <path
              d="M5.5 3.2 19 12.2l-6.3 1.1 3.4 6.2-2.6 1.4-3.4-6.3-4.6 4.4z"
              fill="#fff"
              stroke="#000"
              strokeWidth="1.4"
            />
          </svg>
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-white/50">
        The link opens the recap and full transcript in the browser. No NoteFlow account needed
        to read it.
      </p>
    </Glass>
  );
}
