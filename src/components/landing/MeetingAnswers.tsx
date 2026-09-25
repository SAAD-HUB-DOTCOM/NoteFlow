"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type SVGProps,
} from "react";
import Link from "next/link";
import {
  SparkleIcon,
  ChecklistIcon,
  ShareIcon,
  UsersIcon,
  PlayIcon,
  BookmarkIcon,
  HelpIcon,
  SearchIcon,
  ChevronRightIcon,
  CheckIcon,
} from "@/components/icons";

type Hue = "cyan" | "purple" | "pink" | "orange" | "yellow";
type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const DEMO_HREF = "/meeting/noteflow-product-planning";

const HUE_RGB: Record<Hue, string> = {
  cyan: "0,190,255",
  purple: "150,0,255",
  pink: "255,168,187",
  orange: "245,82,0",
  yellow: "255,245,140",
};

function cardStyle(c: string): CSSProperties {
  return {
    background: `radial-gradient(120% 90% at 50% -12%, rgba(${c},0.34), rgba(${c},0.05) 46%, rgba(7,7,9,0) 72%), linear-gradient(180deg, #0E0E10, #070709)`,
    boxShadow:
      "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 24px 48px -24px rgba(0,0,0,0.75)",
  };
}

type Answer = {
  id: string;
  surface: string;
  need: string;
  hue: Hue;
  /** Card glow / icon-box accent as an `r,g,b` triple, matched to the card's asset. */
  accent?: string;
  icon: IconType;
  iconImg?: string;
  /** Extra classes for the image icon (e.g. `invert` for a dark-on-transparent asset). */
  iconClass?: string;
  visualImg?: string;
  visualClass?: string;
  Preview: ComponentType;
};

type Group = { id: string; label: string; answers: Answer[] };

function PreviewShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-left backdrop-blur-sm">
      {children}
    </div>
  );
}

function Line({ w = "100%", dim = false }: { w?: string; dim?: boolean }) {
  return (
    <span
      className={`block h-1.5 rounded-full ${dim ? "bg-white/10" : "bg-white/20"}`}
      style={{ width: w }}
    />
  );
}

function SummaryPreview() {
  return (
    <PreviewShell>
      <p className="text-[11px] font-medium text-foreground">
        Team agreed to ship bot-free capture first, gated behind a flag.
      </p>
      <div className="mt-2.5 space-y-1.5">
        <Line w="92%" />
        <Line w="78%" />
        <Line w="60%" dim />
      </div>
    </PreviewShell>
  );
}

function ActionItemsPreview() {
  const rows = [
    { t: "Draft the consent copy", who: "AR" },
    { t: "Wire the recording flag", who: "TK" },
    { t: "Book the follow-up", who: "MS" },
  ];
  return (
    <PreviewShell>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.t} className="flex items-center gap-2.5">
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border border-white/20 text-brand-cyan">
              <CheckIcon className="h-2.5 w-2.5" />
            </span>
            <span className="flex-1 truncate text-[11px] text-foreground/85">
              {r.t}
            </span>
            <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white/10 text-[8px] font-semibold text-foreground/80">
              {r.who}
            </span>
          </li>
        ))}
      </ul>
    </PreviewShell>
  );
}

function SharePreview() {
  return (
    <PreviewShell>
      <div className="flex items-center gap-2 rounded-lg border border-white/12 bg-black/40 px-2.5 py-2">
        <ShareIcon className="h-3.5 w-3.5 shrink-0 text-foreground/60" />
        <span className="flex-1 truncate font-mono text-[10.5px] text-foreground/80">
          noteflow.app/r/planning-sync
        </span>
        <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-foreground/75">
          Copy
        </span>
      </div>
      <p className="mt-2 text-[10px] text-foreground/60">
        Anyone with the link can read the recap. No account needed.
      </p>
    </PreviewShell>
  );
}

function TranscriptPreview() {
  const rows = [
    { t: "00:12", s: "Priya", x: "Let's start with the consent flow." },
    { t: "00:31", s: "Tom", x: "We show a banner the moment the bot joins." },
  ];
  return (
    <PreviewShell>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.t} className="flex gap-2.5">
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-brand-cyan">
              {r.t}
            </span>
            <span className="text-[11px] leading-snug text-foreground/85">
              <span className="font-medium text-foreground">{r.s}</span> {r.x}
            </span>
          </li>
        ))}
      </ul>
    </PreviewShell>
  );
}

function PlaybackPreview() {
  return (
    <PreviewShell>
      <div className="flex items-center gap-2.5 rounded-lg border border-brand-orange/40 bg-black/40 px-2.5 py-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-orange/20 text-brand-orange">
          <PlayIcon className="h-3 w-3" />
        </span>
        <span className="flex-1 text-[11px] text-foreground/85">
          &ldquo;…that&rsquo;s the decision, let&rsquo;s log it.&rdquo;
        </span>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-foreground/60">
          24:18
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="h-0.5 flex-1 rounded-full bg-white/10">
          <span className="block h-full w-1/3 rounded-full bg-brand-orange/70" />
        </span>
      </div>
    </PreviewShell>
  );
}

function MomentsPreview() {
  const rows = [
    { k: "Decision", t: "12:04", x: "Ship bot-free first" },
    { k: "Question", t: "18:40", x: "Who owns consent copy?" },
    { k: "Next step", t: "26:02", x: "Follow-up on Thursday" },
  ];
  return (
    <PreviewShell>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.t} className="flex items-center gap-2.5">
            <span className="w-14 shrink-0 text-[9px] font-medium uppercase tracking-wide text-foreground/55">
              {r.k}
            </span>
            <span className="flex-1 truncate text-[11px] text-foreground/85">
              {r.x}
            </span>
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-brand-yellow">
              {r.t}
            </span>
          </li>
        ))}
      </ul>
    </PreviewShell>
  );
}

function AskPreview() {
  return (
    <PreviewShell>
      <p className="text-[11px] font-medium text-foreground">
        What did we tell the client about pricing?
      </p>
      <p className="mt-2 text-[11px] leading-snug text-foreground/80">
        You said the pilot stays free through Q1, then moves to the team plan.
      </p>
      <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-brand-purple/50 bg-brand-purple/15 px-2 py-1 text-[10px] font-medium text-foreground/90">
        <PlayIcon className="h-2.5 w-2.5 text-brand-purple" />
        <span className="font-mono tabular-nums">31:52</span>
        <span className="text-foreground/60">Client review</span>
      </span>
    </PreviewShell>
  );
}

function SearchPreview() {
  const rows = [
    { m: "Client review", x: "…pricing stays free through Q1…" },
    { m: "Planning sync", x: "…gate bot-free behind a flag…" },
  ];
  return (
    <PreviewShell>
      <div className="flex items-center gap-2 rounded-lg border border-white/12 bg-black/40 px-2.5 py-1.5">
        <SearchIcon className="h-3.5 w-3.5 shrink-0 text-foreground/55" />
        <span className="text-[11px] text-foreground/80">pricing</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <li key={r.m} className="text-[10.5px] leading-snug">
            <span className="font-medium text-foreground">{r.m}</span>{" "}
            <span className="text-foreground/55">{r.x}</span>
          </li>
        ))}
      </ul>
    </PreviewShell>
  );
}

const GROUPS: Group[] = [
  {
    id: "after",
    label: "After the call",
    answers: [
      {
        id: "summary",
        surface: "Summary",
        need: "Read what got decided and why, without scrubbing back through the call.",
        hue: "cyan",
        accent: "245,205,110", // warm amber — the idea/lightbulb art
        icon: SparkleIcon,
        iconImg: "/assets/summary-icon.png",
        visualImg: "/assets/Creative_Element-png.png",
        visualClass: "w-[58%] max-w-[200px] bottom-3",
        Preview: SummaryPreview,
      },
      {
        id: "actions",
        surface: "Action items",
        need: "Every task someone agreed to, written down with an owner.",
        hue: "purple",
        accent: "240,96,54", // red-orange — dartboard + amber sparks
        icon: ChecklistIcon,
        iconImg: "/assets/actionitem-icon.png",
        visualImg: "/assets/actionitem.png",
        visualClass: "w-[86%] max-w-[300px] bottom-6",
        Preview: ActionItemsPreview,
      },
      {
        id: "share",
        surface: "Shareable recap",
        need: "Send whoever missed it a link. No account needed to read it.",
        hue: "pink",
        accent: "86,132,232", // royal blue — the handshake
        icon: ShareIcon,
        iconImg: "/assets/shareable-icon.png",
        visualImg: "/assets/shareable.png",
        visualClass: "w-[86%] max-w-[300px] bottom-4",
        Preview: SharePreview,
      },
    ],
  },
  {
    id: "moment",
    label: "In the moment",
    answers: [
      {
        id: "transcript",
        surface: "Speaker transcript",
        need: "Every word as it's said, tagged with who said it.",
        hue: "cyan",
        accent: "94,166,164", // muted teal — the transcript illustration
        icon: UsersIcon,
        iconImg: "/assets/transcript-icon.png",
        visualImg: "/assets/transcript.png",
        visualClass: "w-[88%] max-w-[300px] bottom-6",
        Preview: TranscriptPreview,
      },
      {
        id: "playback",
        surface: "Timestamped playback",
        need: "Click any line to hear that exact moment again.",
        hue: "orange",
        accent: "74,146,224", // blue — the pause button / clapperboard
        icon: PlayIcon,
        iconImg: "/assets/timestampicon.png",
        visualImg: "/assets/timestampd.png",
        visualClass: "w-[72%] max-w-[240px] bottom-6",
        Preview: PlaybackPreview,
      },
      {
        id: "moments",
        surface: "Key moments",
        need: "The decisions and open questions, pulled out and time-stamped.",
        hue: "yellow",
        accent: "124,116,236", // indigo — the blue-purple microphone
        icon: BookmarkIcon,
        iconImg: "/assets/keymomenticon.png",
        iconClass: "invert",
        visualImg: "/assets/keymoment.png",
        visualClass: "w-[64%] max-w-[210px] bottom-4",
        Preview: MomentsPreview,
      },
    ],
  },
  {
    id: "later",
    label: "Weeks later",
    answers: [
      {
        id: "ask",
        surface: "Ask NoteFlow",
        need: "Ask a question the way you'd ask a coworker who was paying attention.",
        hue: "purple",
        accent: "48,152,140", // teal — the "QUESTIONS" magnifier art
        icon: HelpIcon,
        iconImg: "/assets/asknoteflowicon.png",
        iconClass: "invert",
        visualImg: "/assets/asknoteflow.png",
        visualClass: "w-[78%] max-w-[260px] bottom-6 rounded-lg",
        Preview: AskPreview,
      },
      {
        id: "search",
        surface: "Search across meetings",
        need: "Find the one call where it came up, across everything you've recorded.",
        hue: "cyan",
        accent: "78,148,214", // blue — the search / people-and-idea art
        icon: SearchIcon,
        iconImg: "/assets/searchacrossmeetingicon.png",
        visualImg: "/assets/searchacrossmeeting.png",
        visualClass: "w-[86%] max-w-[300px] bottom-4",
        Preview: SearchPreview,
      },
    ],
  },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function MeetingAnswers() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const group = GROUPS[active];
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const measure = useCallback(() => {
    const el = tabRefs.current[active];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);
  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <section
      id="answers"
      className="relative scroll-mt-24 overflow-hidden border-t border-border/60"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-h3 font-normal text-foreground text-balance">
              Whatever you need from a meeting,{" "}
              <span className="font-semibold">NoteFlow already caught it</span>
            </h2>
            <p className="mt-3 max-w-md text-p-regular leading-relaxed text-muted">
              One recording becomes the pieces you actually reuse. Pick when
              you&rsquo;re reaching for it and see what&rsquo;s waiting.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="When you reach for it"
            className="relative inline-flex self-start rounded-full border border-white/10 bg-surface/70 p-1 backdrop-blur-md lg:self-auto "
          >
            <span
              aria-hidden="true"
              className={`absolute inset-y-1 rounded-full border border-white/10 bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] ${
                reduced ? "" : "transition-all duration-300 ease-out"
              }`}
              style={{ left: pill.left, width: pill.width }}
            />
            {GROUPS.map((g, i) => {
              const on = i === active;
              return (
                <button
                  key={g.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(i)}
                  className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    on ? "text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          key={group.id}
          className={reduced ? "mt-10" : "mt-10 animate-fade-in"}
        >
          <div className="-mx-2 flex snap-x snap-mandatory gap-10 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
            {group.answers.map((a, i) => {
              const Icon = a.icon;
              const Preview = a.Preview;
              const accent = a.accent ?? HUE_RGB[a.hue];
              return (
                <Link
                  key={a.id}
                  href={DEMO_HREF}
                  data-card
                  aria-label={`${a.surface} — see it on a real meeting`}
                  style={{
                    ...cardStyle(accent),
                    ...(reduced ? {} : { animationDelay: `${i * 70}ms` }),
                  }}
                  className={`group relative block h-[520px] w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 transition-transform duration-300 hover:-translate-y-0.5 sm:w-[340px] ${
                    reduced ? "" : "animate-rise-in"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(52% 42% at 50% 50%, rgba(${accent},0.24), transparent 70%)`,
                    }}
                  />
                  <div className="relative z-10 flex h-full flex-col p-5">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border"
                        style={{
                          borderColor: `rgba(${accent},0.5)`,
                          backgroundColor: `rgba(${accent},0.12)`,
                        }}
                      >
                        {a.iconImg ? (
                          <img
                            src={a.iconImg}
                            alt=""
                            aria-hidden="true"
                            className={`h-9 w-9 object-contain ${a.iconClass ?? ""}`}
                          />
                        ) : (
                          <Icon
                            className="h-6 w-6"
                            style={{ color: `rgb(${accent})` }}
                          />
                        )}
                      </span>
                      <h3 className="flex-1 font-display text-base font-medium text-foreground">
                        {a.surface}
                      </h3>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/12 bg-white/[0.04] text-foreground/60 transition-colors group-hover:bg-white/[0.1] group-hover:text-foreground">
                        <ChevronRightIcon className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                      {a.need}
                    </p>
                    <div className="my-4 h-px w-full bg-white/10" />
                    {a.visualImg ? (
                      <div className="relative -mx-5 -mb-5 mt-1 flex-1 overflow-hidden">
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-3/4"
                          style={{
                            background: `radial-gradient(58% 60% at 50% 82%, rgba(${accent},0.20), transparent 72%)`,
                          }}
                        />
                        <img
                          src={a.visualImg}
                          alt=""
                          aria-hidden="true"
                          className={`absolute left-1/2 -translate-x-1/2 object-contain drop-shadow-[0_22px_44px_rgba(0,0,0,0.5)] ${a.visualClass ?? "w-[62%] max-w-[220px] bottom-3"}`}
                        />
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <Preview />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
