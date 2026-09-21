import { Logo } from "@/components/Logo";

/**
 * Integrations constellation — DESIGN.md §2.13. A center brand mark wired to integration bubbles by
 * thin lines, over the signature-gradient perspective grid with a radial vignette. Desktop draws the
 * true constellation; small screens fall back to a centered chip cloud (the reference's `sm` variant).
 * Only integrations NoteFlow actually supports appear here — no invented logos.
 */
type Node = { name: string; hue: string; x: number; y: number };

// Percentage coordinates within the constellation box (desktop).
const NODES: Node[] = [
  { name: "Google Meet", hue: "text-brand-cyan", x: 13, y: 20 },
  { name: "Zoom", hue: "text-brand-purple", x: 9, y: 58 },
  { name: "Slack", hue: "text-brand-pink", x: 24, y: 90 },
  { name: "Notion", hue: "text-brand-yellow", x: 88, y: 18 },
  { name: "Microsoft Teams", hue: "text-brand-cyan", x: 92, y: 56 },
  { name: "HubSpot", hue: "text-brand-orange", x: 78, y: 90 },
];

export function IntegrationsConstellation() {
  return (
    <div className="relative">
      {/* signature-gradient perspective grid + radial vignette */}
      <GradientGrid />

      {/* desktop constellation */}
      <div className="relative mx-auto hidden aspect-[16/10] w-full max-w-3xl sm:block">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {NODES.map((n) => (
            <line key={n.name} x1="50" y1="50" x2={n.x} y2={n.y} stroke="rgba(250,245,245,0.16)" strokeWidth="0.25" />
          ))}
        </svg>

        {/* center mark */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div
              aria-hidden="true"
              className="nebula pointer-events-none absolute -inset-8"
              style={{ ["--nebula-color" as string]: "rgba(150,0,255,0.5)" }}
            />
            <div data-border="gradient" className="relative grid h-20 w-20 place-items-center rounded-full bg-surface/90 backdrop-blur-md">
              <Logo className="[&>span:last-child]:hidden" />
            </div>
          </div>
        </div>

        {NODES.map((n) => (
          <div key={n.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            <Bubble node={n} />
          </div>
        ))}
      </div>

      {/* mobile fallback: centered chip cloud */}
      <div className="relative mx-auto flex max-w-sm flex-wrap items-center justify-center gap-3 sm:hidden">
        <div data-border="gradient" className="mb-2 grid h-16 w-16 place-items-center rounded-full bg-surface/90">
          <Logo className="[&>span:last-child]:hidden" />
        </div>
        <div className="flex w-full flex-wrap justify-center gap-2.5">
          {NODES.map((n) => (
            <Bubble key={n.name} node={n} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Bubble({ node }: { node: Node }) {
  return (
    <span className="glass-pill inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5">
      <span className={`grid h-7 w-7 place-items-center rounded-full bg-white/[0.06] text-sm font-semibold ${node.hue}`}>
        {node.name[0]}
      </span>
      <span className="whitespace-nowrap text-sm font-medium text-foreground">{node.name}</span>
    </span>
  );
}

/** Faint perspective grid stroked with the signature gradient, faded by a radial vignette. */
function GradientGrid() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-30" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="constellation-grid" x1="0" y1="60" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFA8BB" />
            <stop offset="0.34" stopColor="#F55200" />
            <stop offset="0.67" stopColor="#9600FF" />
            <stop offset="1" stopColor="#FFF58C" />
          </linearGradient>
        </defs>
        <g stroke="url(#constellation-grid)" strokeWidth="0.15">
          {Array.from({ length: 13 }, (_, i) => (
            <line key={`v${i}`} x1={i * 8.33} y1="0" x2={i * 8.33} y2="60" />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 7.5} x2="100" y2={i * 7.5} />
          ))}
        </g>
      </svg>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle, transparent 55%, #000 100%)" }}
      />
    </div>
  );
}
