"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  MicIcon,
  ChecklistIcon,
  SparkleIcon,
  SearchIcon,
  ShareIcon,
} from "@/components/icons";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Universal-context horizon — adapted from Attio's section: a headline, a huge circle rising from
 * behind it whose top rim lights up, and a hairline five-column capability grid below. A single
 * scrubbed GSAP ScrollTrigger drives `--fill` (0→1): as you scroll in, the rim fills left→right with
 * NoteFlow's brand hues AND every line of text brightens into view with it (opacity tracks the glow,
 * via `.nf-fade`). Before the section is reached, text and rim are dark together. Reduced-motion
 * shows everything lit. Rim geometry/masks live in globals.css (`.nf-planet` / `.nf-rim-*`).
 */
type Cell = { icon: React.ReactNode; title: string; detail: string };

const CELLS: Cell[] = [
  {
    icon: <MicIcon className="size-5" />,
    title: "It records itself.",
    detail: "Joins Meet, Zoom, and Teams from a link or the extension.",
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
    detail: "Send a recap anyone can open. No account needed.",
  },
];

export function HorizonStatement() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        el.style.setProperty("--fill", "1");
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(el, { "--fill": 0 });
        const tween = gsap.to(el, {
          "--fill": 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            end: "center 58%",
            scrub: 1,
          },
        });
        return () => tween.scrollTrigger?.kill();
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="ask"
      className="relative overflow-hidden bg-background"
      style={{ ["--fill" as string]: "0" }}
    >
      <div className="mx-auto max-w-[1440px]">
        {/* headline — brightens with the rim; extra bottom space so it clears the arc */}
        <div className="nf-fade relative z-10 px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-24">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            The notetaker with
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.75rem,1.5rem+4vw,6rem)] font-medium leading-[0.98] tracking-[-0.05em] text-foreground">
            total recall
          </h2>
        </div>

        {/* arc stage: the rising planet whose rim fills (and glows) as --fill grows */}
        <div className="nf-arc-stage" aria-hidden="true">
          <div className="nf-planet">
            <div className="nf-rim-base" />
            <div className="nf-rim-reveal">
              <div className="nf-rim-halo" />
              <div className="nf-rim-glow" />
              <div className="nf-rim-rainbow" />
            </div>
          </div>
        </div>

        {/* five-column capability grid — 1px gaps over a border-tinted track give clean dividers
            between cells only (no outer frame). Text tracks the glow via .nf-fade. */}
        <div className="relative z-10 grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
          {CELLS.map((c) => (
            <div
              key={c.title}
              className="flex flex-col justify-between gap-10 bg-background px-6 py-8 max-lg:items-center max-lg:gap-5 max-lg:text-center lg:min-h-[230px] lg:px-7"
            >
              <span className="nf-fade text-muted" aria-hidden="true">
                {c.icon}
              </span>
              <div className="nf-fade flex flex-col gap-1.5">
                <p className="text-balance text-[15px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground">
                  {c.title}
                </p>
                <p className="text-balance text-[13.5px] font-medium leading-[1.45] text-muted">
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
