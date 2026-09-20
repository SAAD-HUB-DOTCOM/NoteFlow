import { PlayIcon, SparkleIcon, CheckIcon } from "@/components/icons";

/**
 * The hero's centerpiece: a faithful, static recreation of the NoteFlow workspace —
 * recording waveform, AI summary, timestamped transcript, and the Ask box. This is the
 * page's single "spend your boldness here" moment (per the frontend-design skill): the
 * product itself is the most characteristic thing to lead with, so we show it rather than
 * describe it. Built entirely from design-system tokens so it reads as the real app.
 */
export function AppPreview() {
  return (
    <div className="rounded-2xl border border-border bg-surface/90 shadow-2xl shadow-black/50 backdrop-blur-md ring-1 ring-white/5">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F5C05E]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
        <div className="ml-3 hidden flex-1 items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-1 sm:flex">
          <span className="text-xs text-muted">noteflow.app / meeting / product-planning</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* meeting header + live recording state */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[0.95rem] font-semibold text-foreground">
              Weekly product planning
            </h3>
            <p className="mt-0.5 text-xs text-muted">4 speakers · 32 min · recorded today</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger" />
            </span>
            Recording
          </span>
        </div>

        {/* waveform + scrubber */}
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-white">
            <PlayIcon className="h-4 w-4" />
          </span>
          <div className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden="true">
            {WAVEFORM.map((h, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full"
                style={{
                  height: `${h}%`,
                  backgroundColor: i < 22 ? "#6C5CE7" : "#2D2D45",
                }}
              />
            ))}
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted">12:04</span>
        </div>

        {/* two-column body: summary + transcript */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* AI summary + action items */}
          <div className="rounded-lg border border-border bg-background/40 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-accent">
              <SparkleIcon className="h-4 w-4" />
              AI summary
            </div>
            <ul className="mt-2.5 space-y-2 text-[0.8rem] leading-relaxed text-foreground/90">
              <li>Dashboard UI ships Saturday; transcript view lands before Sunday.</li>
              <li>Team aligned on the indigo dark theme for launch.</li>
            </ul>
            <div className="mt-3.5 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted">Action items</p>
              <ul className="mt-2 space-y-1.5 text-[0.8rem] text-foreground/90">
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>Finish dashboard UI — Saad, Sat 8 PM</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>Integrate transcript page — before Sun</span>
                </li>
              </ul>
            </div>
          </div>

          {/* timestamped transcript */}
          <div className="rounded-lg border border-border bg-background/40 p-3.5">
            <p className="text-xs font-medium text-muted">Transcript</p>
            <div className="mt-2.5 space-y-3">
              {TRANSCRIPT.map((line) => (
                <div key={line.t} className="text-[0.8rem] leading-relaxed">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-primary">{line.who}</span>
                    <span className="shrink-0 text-[0.7rem] tabular-nums text-muted">
                      {line.t}
                    </span>
                  </div>
                  <p className="mt-0.5 text-foreground/85">{line.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ask NoteFlow */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2.5">
          <SparkleIcon className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 text-[0.8rem] text-muted">
            Ask this meeting anything — “what did we decide about the theme?”
          </span>
          <span className="hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[0.7rem] text-muted sm:block">
            ⏎
          </span>
        </div>
      </div>
    </div>
  );
}

// Bar heights (%) for the static waveform — front portion is "played" (indigo).
const WAVEFORM = [
  30, 55, 40, 70, 90, 60, 45, 80, 100, 65, 50, 75, 95, 55, 40, 60, 85, 45, 70, 50, 35, 60,
  40, 55, 30, 45, 65, 50, 35, 55, 40, 60, 45, 30,
];

const TRANSCRIPT = [
  { who: "Saad", t: "11:58", text: "Dashboard UI will be done Saturday by 8." },
  { who: "Priya", t: "12:01", text: "Great — let's lock the dark theme for launch." },
  { who: "Lena", t: "12:04", text: "Transcript page goes in right after." },
];
