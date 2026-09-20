/**
 * Cosmic backdrop for the /product surface. Stars are generated from a seeded LCG so
 * the sequence is identical on server and client (no Math.random / Date → no hydration
 * mismatch), and two depth layers give a faint sense of parallax. Purely decorative, so
 * the whole thing is aria-hidden and sits behind content.
 */
function makeStars(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    // Numerical Recipes LCG — deterministic, dependency-free.
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: count }, () => {
    const r = rand();
    return {
      left: `${(rand() * 100).toFixed(3)}%`,
      top: `${(rand() * 100).toFixed(3)}%`,
      size: r < 0.12 ? 2.5 : r < 0.4 ? 1.6 : 1,
      twinkle: r < 0.22,
      delay: `${(rand() * 4).toFixed(2)}s`,
    };
  });
}

const FAR = makeStars(90, 20260919);
const NEAR = makeStars(28, 77123);

export function Starfield({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {[...FAR, ...NEAR].map((star, i) => (
        <span
          key={i}
          className={`absolute rounded-full bg-foreground ${star.twinkle ? "twinkle" : ""}`}
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.size >= 2.5 ? 0.9 : star.size >= 1.6 ? 0.55 : 0.3,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}
