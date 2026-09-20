/**
 * Direct-download control for the NoteFlow browser extension. The button hands over the real
 * packaged .zip from /public — no sign-up wall — and states exactly what it is (browsers, version,
 * size) so nothing is overpromised. Pure CSS motion, so it stays a server component.
 */
export function ExtensionDownload({ align = "start" }: { align?: "start" | "center" }) {
  return (
    <div className={align === "center" ? "flex flex-col items-center" : "flex flex-col items-start"}>
      <a
        href="/noteflow-extension.zip"
        download
        aria-label="Download the NoteFlow browser extension as a .zip"
        className="group relative inline-flex items-center gap-4 rounded-2xl bg-primary py-3.5 pl-4 pr-6 shadow-[0_18px_44px_-14px_rgba(108,92,231,0.7)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_26px_60px_-16px_rgba(108,92,231,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {/* teal spark in the corner — the accent hue, echoing the hero's second nebula */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 -top-1 h-16 w-16 rounded-full bg-accent/25 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
        />
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/12 ring-1 ring-inset ring-white/20">
          <DownloadGlyph />
        </span>
        <span className="relative flex flex-col">
          <span className="font-display text-[1.02rem] font-semibold leading-tight text-white">
            Download the extension
          </span>
          <span className="mt-0.5 text-xs font-medium text-white/80">
            Chrome &amp; Edge · v0.1.0 · 15&nbsp;KB
          </span>
        </span>
      </a>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="text-foreground/70">One-click capture in</span>
        {["Google Meet", "Zoom", "Microsoft Teams"].map((p) => (
          <span
            key={p}
            className="border-l border-border pl-3 first-of-type:border-l-0 first-of-type:pl-0"
          >
            {p}
          </span>
        ))}
      </p>
    </div>
  );
}

/** Authored download glyph — a tray with an arrow that drops in on hover (one consistent stroke). */
function DownloadGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-white"
      aria-hidden="true"
    >
      <g className="transition-transform duration-300 ease-out group-hover:translate-y-[3px]">
        <path d="M12 3v10" />
        <path d="m8 9 4 4 4-4" />
      </g>
      <path d="M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5" />
    </svg>
  );
}
