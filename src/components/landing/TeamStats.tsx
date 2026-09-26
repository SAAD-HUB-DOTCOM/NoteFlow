"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);
type Stat = { value: string; label: string; rise: number };

const STATS: Stat[] = [
  { value: "0", label: "notes to write up by hand", rise: 150 },
  { value: "1 tab", label: "holds every meeting you've had", rise: 250 },
  { value: "∞", label: "meetings recorded on the free plan", rise: 360 },
];
const RING = "ring-white/[0.14] bg-white/[0.03]";
const GLOW = "rgba(255,255,255,0.22)";
const TRAIL = "linear-gradient(to top, transparent, rgba(255,255,255,0.65))";

export function TeamStats() {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const circles = gsap.utils.toArray<HTMLElement>(".stat-circle");
      const trails = gsap.utils.toArray<HTMLElement>(".stat-trail");
      const shown = () => {
        gsap.set(circles, { y: 0, autoAlpha: 1 });
        gsap.set(trails, { scaleY: 1, autoAlpha: 0.35 });
      };

      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          circles.forEach((el) =>
            gsap.set(el, { y: Number(el.dataset.rise) || 200, autoAlpha: 0 }),
          );
          gsap.set(trails, {
            scaleY: 0,
            autoAlpha: 0,
            transformOrigin: "50% 100%",
          });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=140%",
              scrub: 1,
              pin: pin.current,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          circles.forEach((circle, i) => {
            const at = i * 0.6;
            tl.to(
              circle,
              { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out" },
              at,
            );
            tl.to(
              trails[i],
              { scaleY: 1, autoAlpha: 0.35, duration: 1, ease: "power3.out" },
              at,
            );
          });

          return () => shown();
        },
      );
      mm.add("(max-width: 1023px), (prefers-reduced-motion: reduce)", () => {
        shown();
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative">
      <div
        ref={pin}
        className="relative flex min-h-[60svh] items-center overflow-hidden py-20 sm:py-28 lg:min-h-[100svh] lg:py-0"
      >
        <GradientGrid />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-h2 font-medium tracking-[-0.02em] text-foreground text-balance">
              Less to do after every call.
            </h2>
            <p className="mt-3 text-p-regular text-muted [text-wrap:balance]">
              The recap, action items, and answers write themselves.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 items-end justify-items-center gap-14 sm:mt-20 sm:grid-cols-3 sm:gap-8">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="relative flex flex-col items-center"
              >
                <div
                  className="stat-circle relative z-10 will-change-transform"
                  data-rise={s.rise}
                >
                  <div
                    aria-hidden="true"
                    className="nebula pointer-events-none absolute -inset-6"
                    style={{ ["--nebula-color" as string]: GLOW }}
                  />
                  <div
                    className={`relative grid aspect-square w-48 place-items-center rounded-full p-8 text-center ring-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-sm sm:w-56 ${RING}`}
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
                <div
                  aria-hidden="true"
                  className="stat-trail mt-[-1px] h-28 w-px origin-bottom will-change-transform sm:h-36"
                  style={{ background: TRAIL }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function GradientGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <svg
        className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 opacity-[0.13]"
        viewBox="0 0 100 60"
        preserveAspectRatio="xMidYMid slice"
      >
        <g stroke="#FAF5F5" strokeWidth="0.12">
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`v${i}`} x1={i * 6.25} y1="0" x2={i * 6.25} y2="60" />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 6} x2="100" y2={i * 6} />
          ))}
        </g>
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle, transparent 55%, #000 100%)",
        }}
      />
    </div>
  );
}
