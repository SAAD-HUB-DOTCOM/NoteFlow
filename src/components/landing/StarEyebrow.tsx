/**
 * Star eyebrow — DESIGN.md §2.6. The recurring section-opener from the Fathom world: a drawn
 * 4-point sparkle star + a small label, tinted by a hue variant. This is a *marked* sub-element
 * (a drawn icon carrying meaning), deliberately distinct from a bare text kicker — it's the pinned
 * brand idiom, used once per section, never twice back-to-back with the same hue.
 */
type Hue = "cyan" | "yellow" | "pink" | "purple" | "black" | "white";

const HUE: Record<Hue, string> = {
  cyan: "text-brand-cyan",
  yellow: "text-brand-yellow",
  pink: "text-brand-pink",
  purple: "text-brand-purple",
  black: "text-black/70",
  // monochrome variant for the restrained lower-page sections (landing_design_skill.md)
  white: "text-foreground/70",
};

/** The Fathom 4-point sparkle (authored path), one consistent form across the site. */
export function Star4({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 11 11" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M5.45455 0.631303C5.45455 0.380267 5.251 0.176758 5 0.176758C4.749 0.176758 4.54545 0.380267 4.54545 0.631303C4.54545 2.89029 2.71382 4.72221 0.454546 4.72221C0.203545 4.72221 0 4.92576 0 5.17676C0 5.42776 0.203545 5.6313 0.454546 5.6313C2.71391 5.6313 4.54545 7.46239 4.54545 9.72221C4.54545 9.97321 4.749 10.1768 5 10.1768C5.251 10.1768 5.45455 9.97321 5.45455 9.72221C5.45455 7.4623 7.28555 5.6313 9.54546 5.6313C9.79646 5.6313 10 5.42776 10 5.17676C10 4.92576 9.79646 4.72221 9.54546 4.72221C7.28564 4.72221 5.45455 2.89032 5.45455 0.631303Z" />
    </svg>
  );
}

export function StarEyebrow({
  children,
  hue = "cyan",
  align = "start",
  className = "",
}: {
  children: React.ReactNode;
  hue?: Hue;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <p
      className={`flex items-center gap-2 text-p-tiny font-medium uppercase tracking-[0.14em] ${
        align === "center" ? "justify-center" : ""
      } ${HUE[hue]} ${className}`}
    >
      <Star4 className="h-3 w-3 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
