"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The cosmic hero background loop. It mounts only when the visitor hasn't asked for reduced
 * motion — otherwise it renders nothing and the CSS starfield beneath it stays as the calm,
 * still fallback.
 *
 * Mobile autoplay is strict (iOS Safari, Low Power Mode, Data Saver), so:
 * - muted/playsInline are ALSO set imperatively before play() — React applies them as
 *   properties late, and iOS rejects autoplay if they aren't in place first;
 * - the video only fades in on `playing`. If playback is blocked it stays invisible, so the
 *   page shows the starfield rather than a frozen frame with the OS play glyph;
 * - the first touch/click anywhere retries play() — that gesture is what unlocks video when
 *   the OS blocked autoplay outright (e.g. Low Power Mode).
 */
export function HeroVideo() {
  const [show, setShow] = useState(false);
  const [playing, setPlaying] = useState(false);
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

    v.muted = true;
    v.playsInline = true;
    v.setAttribute("muted", "");

    const tryPlay = () => {
      v.play().catch(() => {
        /* blocked — stays invisible; the gesture listener below retries */
      });
    };

    v.load();
    tryPlay();
    v.addEventListener("canplay", tryPlay);

    const gesture = () => tryPlay();
    window.addEventListener("touchstart", gesture, { once: true, passive: true });
    window.addEventListener("pointerdown", gesture, { once: true });

    return () => {
      v.removeEventListener("canplay", tryPlay);
      window.removeEventListener("touchstart", gesture);
      window.removeEventListener("pointerdown", gesture);
    };
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
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          playing ? "opacity-[0.6]" : "opacity-0"
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
