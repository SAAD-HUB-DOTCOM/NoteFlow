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
  }, [active, instant]);
  return phase;
}

function useType(
  text: string,
  go: boolean,
  instant: boolean,
  speed = 28,
  delay = 0,
) {
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

const Key = ({ children }: { children: React.ReactNode }) => (
  <span className="grid h-[18px] min-w-[18px] place-items-center rounded bg-white/10 px-1 text-[10px] text-white/70">
    {children}
  </span>
);

/* ---- scene registry --------------------------------------------------------- */

type PanelProps = { active: boolean; instant: boolean };

type Scene = {
  id: string;
  label: string;
  icon: React.ReactNode;
  lead: string;
  caption: string;
  duration: number;
  Panel: React.ComponentType<PanelProps>;
};

const SCENES: Scene[] = [
  {
    id: "capture",
    label: "Capture",
    icon: <MicIcon className="h-5 w-5" />,
    lead: "Send the notetaker.",
    caption:
      "Paste a meeting link, or record in one click from the Chrome extension.",
    duration: 7200,
    Panel: CaptureWindow,
  },
  {
    id: "transcript",
    label: "Transcript",
    icon: <PlayIcon className="h-5 w-5" />,
    lead: "Every word, timed.",
    caption: "Speaker-labeled lines that follow the recording as it plays.",
    duration: 7000,
    Panel: TranscriptWindow,
  },
  {
    id: "summary",
    label: "Summary",
    icon: <ChecklistIcon className="h-5 w-5" />,
    lead: "The recap writes itself.",
    caption: "Summary and action items are ready when the call ends.",
    duration: 7600,
    Panel: SummaryWindow,
  },
  {
    id: "ask",
    label: "Ask NoteFlow",
    icon: <SparkleIcon className="h-5 w-5" />,
    lead: "Ask your meetings.",
    caption: "Answers cite the exact moment they were said.",
    duration: 8600,
    Panel: AskWindow,
  },
  {
    id: "share",
    label: "Share",
    icon: <ShareIcon className="h-5 w-5" />,
    lead: "One link carries it.",
    caption: "Anyone you send it to can read the recap and transcript.",
    duration: 5800,
    Panel: ShareWindow,
  },
];

function makeStars(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => ({
    left: `${(rand() * 100).toFixed(2)}%`,
    top: `${(rand() * 100).toFixed(2)}%`,
    size: i % 6 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1,
    opacity: 0.3 + rand() * 0.45,
    twinkle: i % 5 === 0,
    delay: `${(rand() * 3.5).toFixed(2)}s`,
  }));
}

const BANDS = [
  {
    stars: makeStars(38, 260919),
    cls: "-top-24 left-[-4rem] right-[-4rem] h-24",
  },
  {
    stars: makeStars(38, 771234),
    cls: "-bottom-24 left-[-4rem] right-[-4rem] h-24",
  },
  {
    stars: makeStars(26, 445566),
    cls: "-left-24 top-[-2rem] bottom-[-2rem] w-24",
  },
  {
    stars: makeStars(26, 998877),
    cls: "-right-24 top-[-2rem] bottom-[-2rem] w-24",
  },
];

function FrameStars() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {BANDS.map((band, b) => (
        <div key={b} className={`absolute ${band.cls}`}>
          {band.stars.map((st, i) => (
            <span
              key={i}
              className={`absolute rounded-full bg-white ${st.twinkle ? "sc-twinkle" : ""}`}
              style={{
                left: st.left,
                top: st.top,
                width: `${st.size}px`,
                height: `${st.size}px`,
                opacity: st.opacity,
                ["--o" as string]: st.opacity,
                animationDelay: st.delay,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ShowcaseDeck() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

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
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
          Capture once, use it four ways.
        </h2>
        <p className="mt-1 text-xl font-normal tracking-[-0.02em] text-muted sm:text-2xl">
          The same recording becomes a transcript, a recap, and answers.
        </p>
      </div>

      <div className="relative mt-14">
        <div
          aria-hidden="true"
          className="absolute -inset-16 rounded-[56px] bg-cover bg-center opacity-90 sm:-inset-24"
          style={{
            backgroundImage: "url(/assets/gradient.webp)",
            filter: "blur(72px) saturate(1.7) brightness(2)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -inset-3 rounded-[30px] bg-cover bg-center opacity-85 sm:-inset-4"
          style={{
            backgroundImage: "url(/assets/gradient.webp)",
            filter: "blur(26px) saturate(1.6) brightness(1.9)",
          }}
        />

        <FrameStars />

        <div
          className="relative flex h-[520px] flex-col overflow-hidden rounded-[20px] border border-white/10 shadow-2xl shadow-black/60 sm:h-[600px] lg:h-[640px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <img
            src="/assets/gradient.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-black/25" />

          <div className="relative z-10 flex items-center justify-between bg-black/30 px-4 py-1.5 text-xs text-white/55 backdrop-blur-xl">
            <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap">
              <span className="font-semibold text-white/75">NoteFlow</span>
              {["File", "Edit", "View", "Meeting", "Window", "Help"].map(
                (m) => (
                  <span key={m} className="hidden sm:inline">
                    {m}
                  </span>
                ),
              )}
            </div>
            <div className="flex items-center gap-3">
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.4}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M2 6.5a8.5 8.5 0 0 1 12 0M4.3 9a5.2 5.2 0 0 1 7.4 0M6.6 11.4a2 2 0 0 1 2.8 0" />
                <circle
                  cx="8"
                  cy="13.4"
                  r="0.7"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
              <svg
                viewBox="0 0 20 12"
                className="h-3 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
                aria-hidden="true"
              >
                <rect x="1" y="1.5" width="15" height="9" rx="2.5" />
                <rect
                  x="2.8"
                  y="3.3"
                  width="9"
                  height="5.4"
                  rx="1.2"
                  fill="currentColor"
                  stroke="none"
                />
                <path d="M17.6 4.5v3" strokeLinecap="round" />
              </svg>
              <span className="hidden tabular-nums sm:inline">
                Fri Sep 26 9:41 AM
              </span>
            </div>
          </div>

          <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
            {SCENES.map((s, i) => {
              const prev = (active - 1 + SCENES.length) % SCENES.length;
              const pos =
                i === active
                  ? "translate-x-0 opacity-100"
                  : i === prev
                    ? "pointer-events-none -translate-x-14 opacity-0"
                    : "pointer-events-none translate-x-14 opacity-0";
              return (
                <div
                  key={s.id}
                  aria-hidden={i !== active}
                  className={`absolute inset-0 grid place-items-center p-4 pb-24 transition-all duration-500 ease-out sm:p-6 sm:pb-28 ${pos}`}
                >
                  <s.Panel active={i === active} instant={reduced} />
                </div>
              );
            })}
          </div>

          <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center sm:bottom-5">
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/35 px-2.5 py-2 backdrop-blur-xl">
              {SCENES.map((s, i) => {
                const on = i === active;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={s.label}
                    aria-pressed={on}
                    onClick={() => setActive(i)}
                    className={`relative grid place-items-center transition-all duration-300 ${
                      on
                        ? "h-14 w-14 -translate-y-2 rounded-[14px] bg-white/20 text-white shadow-lg shadow-black/50"
                        : "h-11 w-11 rounded-xl bg-white/[0.08] text-white/60 hover:bg-white/[0.14] hover:text-white"
                    }`}
                  >
                    {s.icon}
                    <span
                      className={`pointer-events-none absolute -top-9 whitespace-nowrap rounded-md border border-white/10 bg-black/80 px-2.5 py-1 text-xs font-medium text-white shadow-lg transition-all duration-300 ${
                        on
                          ? "translate-y-0 opacity-100"
                          : "translate-y-1 opacity-0"
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p
        className="mx-auto mt-12 max-w-lg text-center text-p-small text-muted"
        aria-live="polite"
      >
        <span className="font-medium text-foreground">{current.lead}</span>{" "}
        {current.caption}
      </p>
    </div>
  );
}

function WindowShell({
  top,
  children,
  barIcon,
  barLabel,
  primary,
}: {
  top: React.ReactNode;
  children: React.ReactNode;
  barIcon: React.ReactNode;
  barLabel: string;
  primary: string;
}) {
  return (
    <div className="w-full max-w-[560px] overflow-hidden rounded-xl border border-white/10 bg-[#161618]/55 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-3xl">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        {top}
      </div>
      <div className="min-h-[210px] p-4">{children}</div>
      <div className="flex items-center justify-between border-t border-white/10 px-3.5 py-2 text-xs text-white/60">
        <span className="inline-flex items-center gap-2">
          <span className="text-white/75">{barIcon}</span>
          {barLabel}
        </span>
        <span className="inline-flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-white/80">
            {primary}
            <Key>↵</Key>
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            Actions
            <Key>⌘</Key>
            <Key>K</Key>
          </span>
        </span>
      </div>
    </div>
  );
}

const BackArrow = () => (
  <svg
    viewBox="0 0 16 16"
    className="h-4 w-4 shrink-0 text-white/50"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6.25 4.75 2.75 8m0 0 3.5 3.25M2.75 8h10.5" />
  </svg>
);

const MEET_URL = "https://meet.google.com/abc-defg-hij";

function CaptureWindow({ active, instant }: PanelProps) {
  const phase = useTimeline(active, instant, [2350, 3100, 4300, 5900]);
  const { out: url } = useType(MEET_URL, active, instant, 42, 500);

  const Step = ({
    on,
    label,
    dot,
  }: {
    on: boolean;
    label: string;
    dot?: "rec" | "ok";
  }) => (
    <span
      className={`inline-flex items-center gap-1.5 transition-colors duration-300 ${
        on ? "font-medium text-white" : "text-white/40"
      }`}
    >
      {on && dot === "rec" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-orange" />
      )}
      {on && dot === "ok" && (
        <CheckIcon className="h-3.5 w-3.5 text-white/85" />
      )}
      {label}
    </span>
  );

  return (
    <WindowShell
      top={
        <>
          <BackArrow />
          <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-sm text-white/90">
            {url || (
              <span className="text-white/35">Paste a meeting link…</span>
            )}
            {active && phase < 1 && <Caret />}
          </span>
          <span
            className={`shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-black transition-transform duration-200 ${
              phase === 1 ? "scale-95" : ""
            }`}
          >
            Send notetaker
          </span>
        </>
      }
      barIcon={<MicIcon className="h-4 w-4" />}
      barLabel="Capture"
      primary="Send notetaker"
    >
      <p className="text-xs font-medium text-white/45">Status</p>
      <div className="mt-2.5 flex items-center gap-2 text-sm">
        <Step on={phase >= 2 && phase < 3} label="joining" />
        <span className="text-white/25">·</span>
        <Step on={phase >= 3 && phase < 4} label="recording" dot="rec" />
        <span className="text-white/25">·</span>
        <Step on={phase >= 4} label="ready" dot="ok" />
      </div>
      <div
        className={`mt-4 rounded-lg bg-white/[0.06] px-3 py-2.5 text-sm text-white/85 transition-all duration-500 ${
          phase >= 4 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        Weekly product planning — recorded. Transcript and recap are ready.
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-white/45">
        On Google Meet, Zoom, or Teams the extension shows a Record button, so
        there is no link to paste at all.
      </p>
    </WindowShell>
  );
}

const WAVE = [
  40, 70, 45, 85, 60, 95, 50, 75, 100, 55, 80, 45, 65, 90, 40, 60, 75, 50, 85,
  45, 70, 55,
];
const LINES = [
  { who: "Saad", t: "11:58", text: "Dashboard will be done Saturday by 8." },
  { who: "Priya", t: "12:01", text: "Then let's lock the launch theme today." },
  { who: "Lena", t: "12:04", text: "Transcript page goes in right after." },
];

function TranscriptWindow({ active, instant }: PanelProps) {
  const progress = useProgress(active, instant, 6200);
  const played = Math.floor(progress * WAVE.length);
  const activeLine = Math.min(
    LINES.length - 1,
    Math.floor(progress * LINES.length),
  );

  return (
    <WindowShell
      top={
        <>
          <BackArrow />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">
            Weekly product planning
          </span>
          <span className="shrink-0 text-xs tabular-nums text-white/45">
            {LINES[activeLine].t} / 32:04
          </span>
        </>
      }
      barIcon={<PlayIcon className="h-4 w-4" />}
      barLabel="Transcript"
      primary="Jump to moment"
    >
      <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.06] px-3 py-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-black">
          <PlayIcon className="h-3.5 w-3.5" />
        </span>
        <span
          className="flex h-6 flex-1 items-center gap-[3px]"
          aria-hidden="true"
        >
          {WAVE.map((h, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full transition-colors duration-200 ${
                i < played ? "bg-white/80" : "bg-white/20"
              }`}
              style={{ height: `${h}%` }}
            />
          ))}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        {LINES.map((l, i) => (
          <div
            key={l.t}
            className={`rounded-lg px-3 py-2 text-sm transition-colors duration-300 ${
              i === activeLine ? "bg-white/[0.09]" : ""
            }`}
          >
            <span className="font-medium text-white/95">{l.who}</span>
            <span className="ml-2 text-xs tabular-nums text-white/40">
              {l.t}
            </span>
            <p className="mt-0.5 leading-snug text-white/70">{l.text}</p>
          </div>
        ))}
      </div>
    </WindowShell>
  );
}

const BULLET_1 =
  "Dashboard ships Saturday; the transcript view follows on Sunday.";
const BULLET_2 = "The team locked the launch theme in the first ten minutes.";

function SummaryWindow({ active, instant }: PanelProps) {
  const b1 = useType(BULLET_1, active, instant, 22, 400);
  const b2 = useType(BULLET_2, active && b1.done, instant, 22, 250);
  const phase = useTimeline(active, instant, [4600, 5300, 6000]);

  const Item = ({
    on,
    text,
    meta,
  }: {
    on: boolean;
    text: string;
    meta: string;
  }) => (
    <p
      className={`flex items-center gap-2 text-sm text-white/85 transition-all duration-500 ${
        on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-white/70" />
      {text}
      <span className="ml-auto text-xs text-white/45">{meta}</span>
    </p>
  );

  return (
    <WindowShell
      top={
        <>
          <BackArrow />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">
            Weekly product planning
          </span>
          <span className="shrink-0 rounded-md bg-white/10 px-2 py-1 text-xs text-white/60">
            Summary
          </span>
        </>
      }
      barIcon={<ChecklistIcon className="h-4 w-4" />}
      barLabel="Summary"
      primary="Copy summary"
    >
      <ul className="min-h-[64px] space-y-2 text-sm leading-relaxed text-white/85">
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
        className={`mt-4 text-xs font-medium text-white/45 transition-opacity duration-300 ${
          phase >= 1 ? "opacity-100" : "opacity-0"
        }`}
      >
        Action items
      </p>
      <div className="mt-2 space-y-2">
        <Item on={phase >= 2} text="Finish dashboard UI" meta="Saad · Sat" />
        <Item on={phase >= 3} text="Review transcript page" meta="Lena · Sun" />
      </div>
    </WindowShell>
  );
}

const QUESTION = "What did I commit to this week?";
const ANSWER =
  "Two things: ship the dashboard by Saturday, and review the transcript page with Lena.";

function AskWindow({ active, instant }: PanelProps) {
  const q = useType(QUESTION, active, instant, 34, 400);
  const phase = useTimeline(active, instant, [2000, 2900, 7300]);
  const a = useType(ANSWER, active && phase >= 2, instant, 24, 0);

  return (
    <WindowShell
      top={
        <>
          <SparkleIcon className="h-4 w-4 shrink-0 text-white/60" />
          <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-sm text-white/90">
            {phase < 1 ? (
              <>
                {q.out || <span className="text-white/35">Ask anything…</span>}
                {active && <Caret />}
              </>
            ) : (
              <span className="text-white/35">Ask anything…</span>
            )}
          </span>
          <span className="shrink-0 rounded-md bg-white/10 px-2 py-1 text-xs text-white/60">
            All meetings
          </span>
        </>
      }
      barIcon={<SparkleIcon className="h-4 w-4" />}
      barLabel="Ask NoteFlow"
      primary="Ask"
    >
      <div className="min-h-[170px]">
        {phase >= 1 && (
          <div className="flex justify-end">
            <p className="max-w-[85%] rounded-xl rounded-br-sm bg-white/12 px-3.5 py-2 text-sm text-white">
              {QUESTION}
            </p>
          </div>
        )}
        <div className="mt-3">
          {phase >= 1 && phase < 2 && (
            <span className="inline-flex items-center gap-1.5 rounded-xl rounded-bl-sm bg-white/[0.07] px-3.5 py-2.5">
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
            <div className="max-w-[92%] rounded-xl rounded-bl-sm bg-white/[0.07] px-3.5 py-2.5">
              <p className="text-sm leading-relaxed text-white/85">
                {a.out}
                {active && !a.done && <Caret />}
              </p>
              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-xs text-brand-cyan transition-all duration-300 ${
                  phase >= 3
                    ? "translate-y-0 opacity-100"
                    : "translate-y-1 opacity-0"
                }`}
              >
                <PlayIcon className="h-3 w-3" />
                Weekly product planning · 08:09
              </span>
            </div>
          )}
        </div>
      </div>
    </WindowShell>
  );
}

function ShareWindow({ active, instant }: PanelProps) {
  const phase = useTimeline(active, instant, [700, 2100, 2400]);
  const copied = phase >= 3;

  return (
    <WindowShell
      top={
        <>
          <BackArrow />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">
            Share this meeting
          </span>
        </>
      }
      barIcon={<ShareIcon className="h-4 w-4" />}
      barLabel="Share"
      primary="Copy link"
    >
      <p className="text-xs font-medium text-white/45">Public link</p>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80">
          noteflow.app/share/weekly-product-planning
        </span>
        <span className="relative shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${
              copied
                ? "border-white/25 bg-white/15 text-white"
                : "border-white/15 text-white"
            } ${phase === 2 ? "scale-95" : ""}`}
          >
            {copied && <CheckIcon className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`absolute left-1/2 top-1/2 h-5 w-5 transition-all duration-[1100ms] ease-out ${
              phase >= 1 ? "opacity-100" : "opacity-0"
            }`}
            style={{
              transform:
                phase >= 2 ? "translate(-2px, -2px)" : "translate(96px, 72px)",
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
      <p className="mt-4 text-[13px] leading-relaxed text-white/45">
        The link opens the recap and full transcript in the browser. No NoteFlow
        account needed to read it.
      </p>
    </WindowShell>
  );
}
