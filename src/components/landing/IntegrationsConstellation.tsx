import { LogoMark } from "@/components/Logo";

/**
 * Integrations constellation — a center brand mark wired to integration bubbles by thin lines,
 * over a faint monochrome grid with a radial vignette. Restyled to the restrained theme
 * (landing_design_skill.md): white light on black, no brand-hue tinting. Desktop draws the true
 * constellation; small screens fall back to a centered chip cloud. Only integrations NoteFlow
 * actually supports appear here — no invented logos.
 */
type Node = { name: string; x: number; y: number };

// Percentage coordinates within the constellation box (desktop).
const NODES: Node[] = [
  { name: "Google Meet", x: 13, y: 20 },
  { name: "Zoom", x: 9, y: 58 },
  { name: "Slack", x: 24, y: 90 },
  { name: "Notion", x: 88, y: 18 },
  { name: "Microsoft Teams", x: 92, y: 56 },
  { name: "HubSpot", x: 78, y: 90 },
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
              style={{ ["--nebula-color" as string]: "rgba(255,255,255,0.24)" }}
            />
            <div className="relative grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-surface/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
              <LogoMark />
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
        <div className="mb-2 grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-surface/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
          <LogoMark />
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
      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.06] text-sm font-semibold text-foreground/80">
        {node.name[0]}
      </span>
      <span className="whitespace-nowrap text-sm font-medium text-foreground">{node.name}</span>
    </span>
  );
}

/** Faint monochrome hairline grid, faded by a radial vignette (restrained theme). */
function GradientGrid() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-[0.14]" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice">
        <g stroke="#FAF5F5" strokeWidth="0.15">
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
