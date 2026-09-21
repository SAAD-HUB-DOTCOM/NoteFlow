/**
 * Direct-download control for the NoteFlow browser extension. A single minimalist gradient pill (the
 * brand's sanctioned CTA, DESIGN.md §2.1) with a small download glyph that nudges on hover — no
 * glowing block, no blurred orb, no boxed icon. It hands over the real packaged .zip from /public
 * (no sign-up wall) and states exactly what it is in one quiet meta line. Pure CSS motion, so it
 * stays a server component.
 */
export function ExtensionDownload({
  align = "start",
  compact = false,
}: {
  align?: "start" | "center";
  /** Tighter meta line for a single-screen hero. */
  compact?: boolean;
}) {
  return (
    <div className={align === "center" ? "flex flex-col items-center" : "flex flex-col items-start"}>
      <a
        href="/noteflow-extension.zip"
        download
        aria-label="Download the NoteFlow browser extension as a .zip"
        className="btn-grad group inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold uppercase tracking-wide"
      >
        <DownloadGlyph />
        Download the extension
      </a>
      <p className={`text-xs text-muted ${compact ? "mt-2.5" : "mt-3"}`}>
        {compact ? (
          <>Free · Chrome &amp; Edge · 15&nbsp;KB</>
        ) : (
          <>Free · Chrome &amp; Edge · one-click capture in Meet, Zoom &amp; Teams</>
        )}
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
      className="h-4 w-4"
      aria-hidden="true"
    >
      <g className="transition-transform duration-300 ease-out group-hover:translate-y-[2px]">
        <path d="M12 3v10" />
        <path d="m8 9 4 4 4-4" />
      </g>
      <path d="M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5" />
    </svg>
  );
}
