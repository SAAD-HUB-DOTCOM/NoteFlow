"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { StarEyebrow } from "@/components/landing/StarEyebrow";

/**
 * How it works — DESIGN.md §2.12. A short narrative of large statements, each revealed on scroll,
 * with one emphasized clause gradient-clipped. A calm, reduced-motion-safe reading of Fathom's
 * scroll-pinned clause-swap: statements fade + rise from an already-legible baseline (never stranded
 * invisible), and everything is simply visible when motion is reduced.
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
      <StarEyebrow hue="cyan">Capture, understand, act</StarEyebrow>
      <div className="mt-10 space-y-16 sm:space-y-24">
        {STEPS.map((s, i) => (
          <Statement key={i} plain={s.plain} accent={s.accent} />
        ))}
      </div>
      <div className="mt-16 sm:mt-20">
        <Link href="/login" className="btn-grad inline-flex px-6 py-3 text-sm font-semibold uppercase tracking-wide">
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
      className={`font-display text-3xl font-normal leading-[1.15] tracking-[-0.03em] text-foreground transition-all duration-700 ease-out sm:text-[2.75rem] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-45"
      }`}
    >
      {plain} <span className="font-semibold text-gradient-brand">{accent}</span>
    </p>
  );
}
