"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The cosmic hero background loop. It mounts only when the visitor hasn't asked for reduced
 * motion — otherwise it renders nothing and the CSS starfield beneath it stays as the calm,
 * still fallback. The src lives on the element (not a <source> child) and we nudge load()/play()
 * on mount, since React-rendered <video autoplay> doesn't reliably kick off on its own. It fades
 * in once it can play, and a left/bottom scrim keeps the headline legible over any frame.
 */
export function HeroVideo() {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setShow(!mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!show || !v) return;
    v.load();
    v.play().catch(() => {
      // Autoplay can be refused until interaction; the still starfield stays visible until then.
    });
  }, [show]);

  if (!show) return null;

  return (
    <>
      <video
        ref={ref}
        src="/hero.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onCanPlay={() => setReady(true)}
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          ready ? "opacity-[0.6]" : "opacity-0"
        }`}
      />
      {/* legibility scrims: keep the lower-left (headline + CTA) grounded in the base color */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/55 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"
      />
    </>
  );
}
