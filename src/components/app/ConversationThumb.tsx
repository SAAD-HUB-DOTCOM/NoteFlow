/**
 * Monochrome meeting thumbnail (REDESIGN.md §9): a compact waveform silhouette derived
 * deterministically from the meeting id, on a graphite chip. Every row gets a stable, distinct
 * shape — the notetaker's characteristic object, never a colorful or near-empty rectangle.
 */
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function barHeights(seed: string, count: number): number[] {
  let state = hashString(seed) || 1;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    const base = (state % 1000) / 1000;
    const envelope = Math.sin((i / (count - 1)) * Math.PI) * 0.45 + 0.55;
    out.push(Math.round((0.24 + base * 0.76) * envelope * 100));
  }
  return out;
}

export function ConversationThumb({
  seed,
  bars = 20,
  className = "",
}: {
  seed: string;
  bars?: number;
  className?: string;
}) {
  const heights = barHeights(seed, bars);
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center gap-[2px] overflow-hidden rounded-lg px-2.5 ${className}`}
      style={{
        background: "linear-gradient(155deg, #141416 0%, #0c0c0d 100%)",
        border: "1px solid var(--nf-border)",
      }}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full"
          style={{ height: `${Math.max(h, 12)}%`, background: "#fff", opacity: 0.22 + (h / 100) * 0.4 }}
        />
      ))}
    </div>
  );
}
