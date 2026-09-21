import { SparkleIcon, CheckIcon } from "@/components/icons";

/**
 * The hero's centerpiece: an overlapping stack of NoteFlow product cards over the starfield.
 * It reads as one dimensional mass — a bright focal card in front, two dimmer cards receding
 * behind it — rather than separate parked widgets. Contained within the hero (no edge bleed),
 * it collapses to two stacked cards on small screens.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* stacked, legible layout on mobile/tablet */}
      <div className="space-y-4 lg:hidden">
        <SummaryCard variant="focal" />
        <CaptureCard variant="recede" />
      </div>

      {/* overlapping layered cluster on large screens */}
      <div className="relative hidden h-[470px] lg:block">
        <Floating className="left-0 top-0 w-[262px] z-0 scale-[0.97]" glow="cyan" delay="0s">
          <CaptureCard variant="recede" />
        </Floating>
        <Floating className="right-0 top-[7%] w-[312px] z-10" glow="pink" delay="1.1s">
          <AskCard variant="recede" />
        </Floating>
        <Floating className="bottom-0 left-[13%] w-[356px] z-20" glow="purple" delay="0.5s">
          <SummaryCard variant="focal" />
        </Floating>
      </div>
    </div>
  );
}

const GLOWS: Record<string, string> = {
  purple: "rgba(150,0,255,0.42)",
  pink: "rgba(255,168,187,0.30)",
  cyan: "rgba(0,190,255,0.26)",
};

function Floating({
  children,
  className,
  glow,
  delay,
}: {
  children: React.ReactNode;
  className: string;
  glow: keyof typeof GLOWS | string;
  delay: string;
}) {
  return (
    <div className={`absolute ${className}`}>
      <div
        className="nebula absolute -inset-6 -z-10"
        style={{ ["--nebula-color" as string]: GLOWS[glow] ?? glow }}
      />
      <div className="animate-float" style={{ animationDelay: delay }}>
        {children}
      </div>
    </div>
  );
}

type Variant = "focal" | "recede";

/**
 * The focal card is brighter with a crisper border and a stronger cast shadow; receding cards
 * are dimmer with a softer edge, so the stack has one clear front and reads with depth.
 */
function Shell({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  const skin =
    variant === "focal"
      ? "border-white/12 bg-surface shadow-2xl shadow-black/70 ring-1 ring-white/10"
      : "border-border/70 bg-surface/80 shadow-xl shadow-black/40";
  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-md ${skin}`}>{children}</div>
  );
}

/* AI summary + action items — the focal anchor card. */
function SummaryCard({ variant }: { variant: Variant }) {
  return (
    <Shell variant={variant}>
      <div className="flex items-center gap-2">
        <SparkleIcon className="h-4 w-4 text-accent" />
        <h3 className="font-display text-[0.95rem] font-semibold text-foreground">
          Project check-in
        </h3>
        <span className="ml-auto text-xs text-muted">4 speakers · 32 min</span>
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <ul className="space-y-2 text-[0.82rem] leading-relaxed text-foreground/90">
          <li>Dashboard ships Saturday; transcript view follows before Sunday.</li>
          <li>Team locked the launch theme in the first ten minutes.</li>
        </ul>
        <div className="mt-3 space-y-1.5 text-[0.82rem] text-foreground/90">
          <p className="text-xs font-medium text-muted">Action items</p>
          <div className="flex items-center gap-2">
            <CheckIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span>Finish dashboard UI — Saad, Sat 8 PM</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span>Integrate transcript page — Lena, Sun</span>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* Capture options — how NoteFlow joins the call. */
function CaptureCard({ variant }: { variant: Variant }) {
  const options = [
    { label: "Audio + video", on: false },
    { label: "Audio only", on: true },
    { label: "Transcript only", on: false },
    { label: "Don't join", on: false },
  ];
  return (
    <Shell variant={variant}>
      <p className="text-xs font-medium text-muted">How should NoteFlow join?</p>
      <ul className="mt-2.5 space-y-1">
        {options.map((o) => (
          <li
            key={o.label}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.82rem] ${
              o.on ? "bg-primary/15 text-foreground" : "text-foreground/80"
            }`}
          >
            <span
              className={`grid h-4 w-4 place-items-center rounded-full border ${
                o.on ? "border-primary" : "border-border"
              }`}
            >
              {o.on && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            {o.label}
          </li>
        ))}
      </ul>
    </Shell>
  );
}

/* Ask NoteFlow — conversational recall. */
function AskCard({ variant }: { variant: Variant }) {
  return (
    <Shell variant={variant}>
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-[0.82rem] text-white">
          What did I commit to this week?
        </p>
      </div>
      <div className="mt-3 flex gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-background text-primary">
          <SparkleIcon className="h-3.5 w-3.5" />
        </span>
        <p className="rounded-2xl rounded-bl-sm border border-border bg-background/70 px-3.5 py-2 text-[0.82rem] leading-relaxed text-foreground/90">
          Two things: ship the dashboard by Saturday, and review the transcript page with Lena.
        </p>
      </div>
    </Shell>
  );
}
