/**
 * Library meeting thumbnail — a monochrome waveform whose *envelope* (peak position, width,
 * a secondary peak, amplitude, and bar density) is derived deterministically from the meeting id,
 * so silhouettes are visibly individual rather than the same hump with jitter. Stable across
 * renders (no randomness). Kept separate from Home's ConversationThumb, which stays frozen.
 */
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function heights(seed: string): number[] {
  const h = hashString(seed);
  const peak = 0.16 + ((h & 63) / 63) * 0.68; // where the loudest part sits (0.16–0.84)
  const width = 0.14 + (((h >> 6) & 31) / 31) * 0.3; // envelope spread
  const amp = 0.72 + (((h >> 11) & 31) / 31) * 0.28;
  const peak2 = ((h >> 3) & 127) / 127; // secondary swell position
  const count = 16 + ((h >> 17) & 7); // density 16–23

  let state = h || 1;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    const jitter = (state % 1000) / 1000;
    const t = count === 1 ? 0.5 : i / (count - 1);
    const g1 = Math.exp(-((t - peak) ** 2) / (2 * width * width));
    const g2 = 0.5 * Math.exp(-((t - peak2) ** 2) / (2 * (width * 0.7) ** 2));
    const env = Math.min(1, g1 + g2);
    const v = 0.14 + jitter * 0.3 + env * 0.56 * amp;
    out.push(Math.max(12, Math.min(100, Math.round(v * 100))));
  }
  return out;
}

export function MeetingWaveThumb({ seed, className = "" }: { seed: string; className?: string }) {
  const bars = heights(seed);
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center gap-[2px] overflow-hidden rounded-lg px-2.5 ${className}`}
      style={{ background: "linear-gradient(155deg, #151517 0%, #0b0b0c 100%)", border: "1px solid var(--nf-border)" }}
    >
      {bars.map((h, i) => (
        <span
          key={i}
          className="flex-1 rounded-full"
          style={{ maxWidth: 3, height: `${h}%`, background: "#fff", opacity: 0.2 + (h / 100) * 0.45 }}
        />
      ))}
    </div>
  );
}
