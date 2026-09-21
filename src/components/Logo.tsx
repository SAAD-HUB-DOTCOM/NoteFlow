/**
 * NoteFlow wordmark — a clean, confident text logo (no boxed icon). It uses the brand's own
 * two-weight idiom (DESIGN.md §1.2): "Note" semibold + "Flow" regular, one foreground color, tight
 * tracking. No gradient text (reserved for the headline span), no decorative mark.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-[1.2rem] leading-none tracking-[-0.02em] text-foreground ${className}`}
    >
      <span className="font-semibold">Note</span>
      <span className="font-normal">Flow</span>
    </span>
  );
}

/**
 * Compact monogram for icon-only slots (e.g. the integrations hub). Just the "N" of the wordmark in
 * the same face — minimal, framed by whatever container it sits in.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-xl font-semibold leading-none tracking-[-0.02em] text-foreground ${className}`}
    >
      N
    </span>
  );
}
