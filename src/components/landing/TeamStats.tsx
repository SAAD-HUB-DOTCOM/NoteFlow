"use client";

import { useEffect, useRef } from "react";

/**
 * Team stats — DESIGN.md §2.11. The Fathom "section_teams" pattern: three circular stats, each a
 * ring in a distinct hue with a vertical trail, that rise into place one-by-one on a pinned scroll
 * timeline over the signature-gradient grid. Desktop pins and scrubs; mobile falls back to a static
 * stacked column. Numbers are honest product facts (true by how NoteFlow works), never invented.
 *
 * Motion note: this reproduces a GSAP ScrollTrigger pinned/scrubbed timeline with a dependency-free
 * scroll engine (the registry blocks installing gsap in this environment). The reveal math and the
 * markup are isolated so the internals can be swapped for gsap.registerPlugin(ScrollTrigger) later
 * without touching the layout.
 */
type Stat = { value: string; label: string; hue: Hue; rise: number };
type Hue = "orange" | "pink" | "cyan";

const STATS: Stat[] = [
  { value: "0", label: "notes to write up by hand", hue: "orange", rise: 150 },
  { value: "1 tab", label: "holds every meeting you've had", hue: "pink", rise: 250 },
  { value: "∞", label: "meetings recorded on the free plan", hue: "cyan", rise: 360 },
];

const RING: Record<Hue, string> = {
  orange: "ring-brand-orange/45 bg-brand-orange/12",
  pink: "ring-brand-pink/45 bg-brand-pink/12",
  cyan: "ring-brand-cyan/45 bg-brand-cyan/12",
};
const GLOW: Record<Hue, string> = {
  orange: "rgba(245,82,0,0.45)",
  pink: "rgba(255,168,187,0.4)",
  cyan: "rgba(0,190,255,0.4)",
};
const TRAIL: Record<Hue, string> = {
  orange: "linear-gradient(to top, transparent, #F55200)",
  pink: "linear-gradient(to top, transparent, #FFA8BB)",
  cyan: "linear-gradient(to top, transparent, #00BEFF)",
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function TeamStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mq = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const setAll = (p: number) => {
      // Per-item window with overlap: item i reveals across [i*step, i*step + win].
      const step = 0.26;
      const win = 0.6;
      STATS.forEach((s, i) => {
        const local = easeOut(clamp01((p - i * step) / win));
        const circle = circleRefs.current[i];
        const trail = trailRefs.current[i];
        if (circle) {
          circle.style.opacity = String(local);
          circle.style.transform = `translateY(${(1 - local) * s.rise}px)`;
        }
        if (trail) {
          trail.style.opacity = String(0.35 * local);
          trail.style.transform = `scaleY(${local})`;
        }
      });
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = section.getBoundingClientRect();
        const distance = section.offsetHeight - window.innerHeight;
        const p = clamp01(-rect.top / Math.max(1, distance));
        setAll(p);
      });
    };

    const enable = () => {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    };
    const disable = () => {
      window.removeEventListener("scroll", onScroll);
      setAll(1); // fully revealed when not scrubbing (mobile / reduced motion)
    };

    const apply = () => (mq.matches && !reduce.matches ? enable() : disable());
    apply();
    mq.addEventListener("change", apply);
    reduce.addEventListener("change", apply);

    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", apply);
      reduce.removeEventListener("change", apply);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    // Tall on desktop to give the pin scroll distance; natural height on mobile.
    <section ref={sectionRef} className="relative lg:h-[220vh]">
      <div className="lg:sticky lg:top-0 flex min-h-[60svh] items-center overflow-hidden py-20 sm:py-28 lg:min-h-[100svh] lg:py-0">
        <GradientGrid />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h2 className="mx-auto max-w-2xl text-center font-display text-h2 font-normal text-foreground text-balance">
            Less to do <span className="font-semibold">after every call</span>
          </h2>

          <div className="mt-16 grid grid-cols-1 items-end justify-items-center gap-14 sm:mt-20 sm:grid-cols-3 sm:gap-8">
            {STATS.map((s, i) => (
              <div key={s.label} className="relative flex flex-col items-center">
                {/* rising circle */}
                <div
                  ref={(el) => {
                    circleRefs.current[i] = el;
                  }}
                  className="relative z-10 will-change-transform"
                >
                  <div
                    aria-hidden="true"
                    className="nebula pointer-events-none absolute -inset-6"
                    style={{ ["--nebula-color" as string]: GLOW[s.hue] }}
                  />
                  <div
                    className={`relative grid aspect-square w-48 place-items-center rounded-full p-8 text-center ring-1 backdrop-blur-sm sm:w-56 ${RING[s.hue]}`}
                  >
                    <div>
                      <div className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
                        {s.value}
                      </div>
                      <p className="mx-auto mt-2 max-w-[9rem] text-p-tiny leading-snug text-foreground/70">
                        {s.label}
                      </p>
                    </div>
                  </div>
                </div>
                {/* trail beam growing up toward the circle */}
                <div
                  ref={(el) => {
                    trailRefs.current[i] = el;
                  }}
                  aria-hidden="true"
                  className="mt-[-1px] h-28 w-px origin-bottom will-change-transform sm:h-36"
                  style={{ background: TRAIL[s.hue] }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Faint perspective grid stroked with the signature gradient, faded by a radial vignette. */
function GradientGrid() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg
        className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 opacity-25"
        viewBox="0 0 100 60"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="teamstats-grid" x1="0" y1="60" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFA8BB" />
            <stop offset="0.34" stopColor="#F55200" />
            <stop offset="0.67" stopColor="#9600FF" />
            <stop offset="1" stopColor="#FFF58C" />
          </linearGradient>
        </defs>
        <g stroke="url(#teamstats-grid)" strokeWidth="0.12">
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`v${i}`} x1={i * 6.25} y1="0" x2={i * 6.25} y2="60" />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 6} x2="100" y2={i * 6} />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle, transparent 55%, #000 100%)" }} />
    </div>
  );
}
