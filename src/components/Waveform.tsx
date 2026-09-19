/**
 * A deterministic waveform for a meeting. Bar heights are derived from the meeting id, so
 * every recording gets a stable, recognizable silhouette without any per-render randomness
 * (SSR and client agree). It's monochrome indigo — differentiation comes from the shape, not
 * from introducing new accent colors per card. This represents the actual recording, the
 * characteristic object of a notetaker's world; it isn't a decorative sparkline.
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
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    // xorshift step for a stable pseudo-random sequence
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    const base = (state % 1000) / 1000; // 0..1
    // Shape it toward a natural speech envelope: taller in the middle, never fully flat.
    const envelope = Math.sin((i / (count - 1)) * Math.PI) * 0.4 + 0.6;
    heights.push(Math.round((0.22 + base * 0.78) * envelope * 100));
  }
  return heights;
}

export function Waveform({
  seed,
  bars = 32,
  className = "",
}: {
  seed: string;
  bars?: number;
  className?: string;
}) {
  const heights = barHeights(seed, bars);
  return (
    <div
      className={`flex h-full w-full items-center justify-between gap-[2px] ${className}`}
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-full rounded-full bg-primary"
          style={{ height: `${Math.max(h, 10)}%`, opacity: 0.38 + (h / 100) * 0.5 }}
        />
      ))}
    </div>
  );
}
