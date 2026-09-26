"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { StarEyebrow } from "@/components/landing/StarEyebrow";

/**
 * How it works — a short narrative of large statements, each revealed on scroll. Restyled to the
 * restrained theme (landing_design_skill.md): the emphasized clause is white/semibold and the rest
 * of the sentence muted (the "**Fast.** Think in milliseconds." pattern) — no gradient text.
 * Statements fade + rise from an already-legible baseline (never stranded invisible), and
 * everything is simply visible when motion is reduced.
 */
const STEPS = [
  {
    plain: "Accurate notes and summaries keep your whole team aligned —",
    accent: "even the people who missed the call.",
  },
  {
    plain: "Ask NoteFlow across every conversation and get the answer",
    accent: "with the exact moment it was said.",
  },
  {
    plain: "Action items and insights flow to your tools automatically,",
    accent: "moving work forward without the busywork.",
  },
];

export function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl">
      <StarEyebrow hue="white">Capture, understand, act</StarEyebrow>
      <div className="mt-10 space-y-16 sm:space-y-24">
        {STEPS.map((s, i) => (
          <Statement key={i} plain={s.plain} accent={s.accent} />
        ))}
      </div>
      <div className="mt-16 sm:mt-20">
        <Link
          href="/login"
          className="vsp-btn vsp-btn-solid inline-flex h-[42px] items-center rounded-md px-[18px] text-[13.5px] font-medium tracking-[-0.02em]"
        >
          Try NoteFlow for your team
        </Link>
      </div>
    </div>
  );
}

function Statement({ plain, accent }: { plain: string; accent: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
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
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <p
      ref={ref}
      className={`font-display text-3xl font-normal leading-[1.15] tracking-[-0.03em] text-muted transition-all duration-700 ease-out sm:text-[2.75rem] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-45"
      }`}
    >
      {plain} <span className="font-semibold text-foreground">{accent}</span>
    </p>
  );
}
