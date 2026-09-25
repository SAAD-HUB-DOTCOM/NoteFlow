/**
 * Monochrome brand-signature thumbnail for a conversation (REDESIGN.md §9/§21): a crop of the
 * NoteFlow ribbon/wave texture, desaturated and dark, positioned deterministically from the
 * meeting id so each row gets a stable, distinct crop. Never colorful, never overpowering.
 */
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function ConversationThumb({
  seed,
  className = "",
}: {
  seed: string;
  className?: string;
}) {
  const h = hashString(seed);
  const x = h % 100;
  const y = (h >> 8) % 100;
  return (
    <div
      aria-hidden="true"
      className={`relative shrink-0 overflow-hidden rounded-lg ${className}`}
      style={{ background: "var(--nf-surface-3)", border: "1px solid var(--nf-border)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/assets/Wave-texture.png)",
          backgroundSize: "260% auto",
          backgroundPosition: `${x}% ${y}%`,
          filter: "grayscale(1) brightness(0.85) contrast(1.08)",
          opacity: 0.72,
        }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.35))" }} />
    </div>
  );
}
