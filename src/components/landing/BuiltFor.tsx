"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  UsersIcon,
  SearchIcon,
  ClockIcon,
  MicIcon,
  CalendarIcon,
  ChecklistIcon,
  SparkleIcon,
} from "@/components/icons";

/**
 * "Built for the way you meet." — adapted from Raycast's testimonials section (landing skill §5.6):
 * a center-active carousel of compact chips over a hairline divider, then a detail panel with
 * mono `label:` + badge rows, a vertical divider, and a large statement where only the key clause
 * is white. Raycast's version is social proof (named people, avatars, @handles, quotes); that
 * would be fabricated for NoteFlow, so the *presentation* is kept and the fake testimonials are
 * dropped: chips are the real kinds of meetings NoteFlow records, the panel shows real
 * capabilities, and the statement is product copy framed by decorative quote marks — with no
 * invented person attached. Light accents follow the reference: a 1px light-gradient ON the
 * border of the active card and pills (plus a tight bloom), and a divider that fades at the
 * ends and shines at its center — no large blurred halos.
 */

/**
 * 1px light-gradient border (bright top edge fading down), drawn with the mask-composite
 * technique so the light sits ON the border itself — the reference's card/pill treatment,
 * not a blurred halo. Parent must be `relative` and rounded; the radius is inherited.
 */
function LightBorder({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        borderRadius: "inherit",
        padding: 1,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.05))",
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
  );
}
type Item = {
  type: string;
  context: string;
  icon: React.ReactNode;
  captured: { badge: string; desc: string };
  ask: { badge: string; desc: string };
  lead: string; // emphasized clause
  tail: string; // muted continuation
};

const ITEMS: Item[] = [
  {
    type: "Sales calls",
    context: "Discovery & demos",
    icon: <UsersIcon className="h-5 w-5" />,
    captured: { badge: "Summary + next steps", desc: "The recap and what you promised, ready before you switch tabs." },
    ask: { badge: "What did they push back on?", desc: "Pull the exact moment an objection came up, on any call." },
    lead: "Close from the record, not your memory.",
    tail: "Every demo ends with the follow-up already written.",
  },
  {
    type: "User interviews",
    context: "Product research",
    icon: <SearchIcon className="h-5 w-5" />,
    captured: { badge: "Key moments", desc: "Every quote and reaction marked and synced to the recording." },
    ask: { badge: "What did users say about pricing?", desc: "Search one theme across a whole round of interviews." },
    lead: "Findings, not transcripts to re-read.",
    tail: "Jump straight to the moment a user said it.",
  },
  {
    type: "Team standups",
    context: "Daily sync",
    icon: <ClockIcon className="h-5 w-5" />,
    captured: { badge: "Action items", desc: "Who owns what, pulled out and assigned automatically." },
    ask: { badge: "What did we commit to Monday?", desc: "Check last week's calls without watching them again." },
    lead: "Nobody has to re-explain the standup.",
    tail: "The recap lands the moment the call ends.",
  },
  {
    type: "1:1s",
    context: "Manager & report",
    icon: <MicIcon className="h-5 w-5" />,
    captured: { badge: "Private recap", desc: "Your summary and follow-ups, kept to your own workspace." },
    ask: { badge: "What did we agree on last time?", desc: "Walk into the next 1:1 already caught up." },
    lead: "Be in the conversation, not taking notes.",
    tail: "The record is there when you need it.",
  },
  {
    type: "Client calls",
    context: "Agency & freelance",
    icon: <CalendarIcon className="h-5 w-5" />,
    captured: { badge: "Shareable recap", desc: "Send a clean summary anyone can open — no account needed." },
    ask: { badge: "What scope did we agree on?", desc: "Find the decision weeks later, with the timestamp." },
    lead: "Everyone leaves with the same record.",
    tail: "No more disagreements about what was said.",
  },
  {
    type: "Hiring interviews",
    context: "Panels & screens",
    icon: <ChecklistIcon className="h-5 w-5" />,
    captured: { badge: "Structured notes", desc: "Transcript and highlights, ready to compare candidates." },
    ask: { badge: "How did they answer on system design?", desc: "Revisit any answer without rewatching the call." },
    lead: "Decide on evidence, not impressions.",
    tail: "Every interviewer works from the same record.",
  },
];

const ADVANCE_MS = 4200;

export function BuiltFor() {
  const [active, setActive] = useState(2);
  const [tx, setTx] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const chips = useRef<(HTMLButtonElement | null)[]>([]);
  const paused = useRef(false);

  // Center the active chip inside the viewport (measured, so it works at any width).
  useLayoutEffect(() => {
    const recenter = () => {
      const vp = viewport.current;
      const chip = chips.current[active];
      if (!vp || !chip) return;
      setTx(vp.clientWidth / 2 - (chip.offsetLeft + chip.offsetWidth / 2));
    };
    recenter();
    window.addEventListener("resize", recenter);
    return () => window.removeEventListener("resize", recenter);
  }, [active]);

  // Auto-advance, paused on hover/focus and when reduced motion is requested.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = window.setInterval(() => {
      if (!paused.current) setActive((a) => (a + 1) % ITEMS.length);
    }, ADVANCE_MS);
    return () => window.clearInterval(id);
  }, []);

  const item = ITEMS[active];

  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocusCapture={() => (paused.current = true)}
      onBlurCapture={() => (paused.current = false)}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* SectionTitle: short h2 ending in a period + one muted sentence (skill §4.1) */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-h2 font-medium tracking-[-0.02em] text-foreground text-balance">
            Built for the way you meet.
          </h2>
          <p className="mt-3 text-p-regular text-muted [text-wrap:balance]">
            However the call happens, NoteFlow keeps the record.
          </p>
        </div>

        {/* center-active carousel: only the middle chip carries a card; neighbours dim with distance */}
        <div ref={viewport} className="marquee-mask relative mt-16 overflow-hidden">
          <div
            className="flex w-max items-center gap-4 py-5 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.3,1.04,0.45,1)] sm:gap-7"
            style={{ transform: `translate3d(${tx}px,0,0)` }}
          >
            {ITEMS.map((it, i) => {
              const on = i === active;
              const dist = Math.abs(i - active);
              return (
                <button
                  key={it.type}
                  ref={(el) => {
                    chips.current[i] = el;
                  }}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={on}
                  aria-label={`${it.type} — ${it.context}`}
                  className={`relative flex shrink-0 items-center gap-3.5 rounded-2xl px-5 py-3.5 text-left transition-all duration-300 hover:!opacity-90 ${
                    on
                      ? "bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_0_20px_-8px_rgba(255,255,255,0.35)]"
                      : ""
                  }`}
                  style={{ opacity: on ? 1 : dist === 1 ? 0.45 : 0.18 }}
                >
                  {/* light gradient sitting on the card's border (reference treatment) */}
                  <LightBorder
                    className={`transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"}`}
                  />
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ring-1 transition-colors ${
                      on
                        ? "bg-surface-hover text-foreground ring-border"
                        : "bg-surface text-muted ring-border/60"
                    }`}
                  >
                    {it.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block whitespace-nowrap text-[15px] font-medium leading-tight text-foreground">
                      {it.type}
                    </span>
                    <span className="mt-0.5 block whitespace-nowrap text-[13px] leading-tight text-muted">
                      {it.context}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* separation hairline: fades out toward both ends, shines at the center */}
        <div className="relative mt-12 h-px w-full">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.10) 22%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0.10) 78%, transparent)",
            }}
          />
          {/* soft bloom hugging the line's center */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[5px] w-2/5 -translate-x-1/2 -translate-y-1/2 blur-[5px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
            }}
          />
        </div>

        {/* detail panel: mono label + badge rows | vertical divider | large white/muted statement */}
        <div
          key={active}
          className="animate-fade-in mt-12 grid items-center gap-10 md:grid-cols-[1fr_1px_1.1fr] md:gap-12 lg:gap-16"
        >
          <div className="flex flex-col gap-10">
            <DetailRow
              label="Captured for you:"
              icon={<SparkleIcon className="h-3.5 w-3.5" />}
              badge={item.captured.badge}
              desc={item.captured.desc}
            />
            <DetailRow
              label="Ask NoteFlow:"
              icon={<SearchIcon className="h-3.5 w-3.5" />}
              badge={item.ask.badge}
              desc={item.ask.desc}
              quoted
            />
          </div>

          <div aria-hidden="true" className="hidden w-px self-stretch bg-border/70 md:block" />

          <div className="max-w-md">
            <span aria-hidden="true" className="block select-none font-display text-5xl leading-[0.6] text-muted/50">
              “
            </span>
            <p className="mt-3 font-display text-[clamp(1.4rem,1.05rem+1.1vw,2rem)] font-medium leading-[1.4] tracking-[-0.02em]">
              <span className="text-foreground">{item.lead}</span>{" "}
              <span className="text-muted">{item.tail}</span>
            </p>
            <span aria-hidden="true" className="mt-5 block select-none font-display text-5xl leading-[0.6] text-muted/50">
              ”
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** `Label:` in mono on the left; badge with an icon tile + muted description on the right. */
function DetailRow({
  label,
  icon,
  badge,
  desc,
  quoted = false,
}: {
  label: string;
  icon: React.ReactNode;
  badge: string;
  desc: string;
  quoted?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[170px_1fr] sm:gap-6">
      <p className="pt-1.5 font-mono text-[12.5px] tracking-[0.08em] text-muted">{label}</p>
      <div>
        <span className="relative inline-flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5 text-[13.5px] font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_14px_-6px_rgba(255,255,255,0.3)]">
          <LightBorder />
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] bg-surface-hover text-foreground/80">
            {icon}
          </span>
          {quoted ? `“${badge}”` : badge}
        </span>
        <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted">{desc}</p>
      </div>
    </div>
  );
}
