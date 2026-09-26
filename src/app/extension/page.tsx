import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "NoteFlow Chrome extension — one-click meeting capture",
  description:
    "Install the NoteFlow extension and record any Google Meet, Zoom, or Teams call in one click — no link pasting.",
};

function DownloadGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <g className="transition-transform duration-300 ease-out group-hover:translate-y-[2px]">
        <path d="M12 3v10" />
        <path d="m8 9 4 4 4-4" />
      </g>
      <path d="M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5" />
    </svg>
  );
}

/**
 * Self-serve install page for the capture extension, in NoteFlow's restrained monochrome theme.
 * Chrome forbids sites from installing extensions automatically, so until the Web Store listing is
 * live this hands over the packaged zip plus the load-unpacked steps. The manual paste-a-link flow
 * keeps working without the extension — this is the faster path, not a requirement.
 */
export default function ExtensionPage() {
  const steps: React.ReactNode[] = [
    <>Unzip the download — you&apos;ll get a <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">noteflow-extension</code> folder.</>,
    <>Open <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">chrome://extensions</code> and turn on <strong className="font-medium text-foreground">Developer mode</strong> (top right).</>,
    <>Click <strong className="font-medium text-foreground">Load unpacked</strong> and select the unzipped folder.</>,
    <>Sign in at <Link href="/login" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">NoteFlow</Link> once (same Chrome profile), then join any meeting — the Record button is waiting.</>,
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/product" aria-label="NoteFlow home" className="inline-flex">
            <Logo />
          </Link>
          <Link href="/app/meetings" className="text-sm font-medium text-muted transition-colors hover:text-foreground">
            My Meetings
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-6 sm:py-16">
        <p className="font-display text-[12px] font-medium uppercase tracking-[0.16em] text-muted">Chrome extension</p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-[-0.03em] text-foreground sm:text-[2.6rem] sm:leading-[1.05]">
          Record meetings in one click
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
          With the NoteFlow extension, a small Record button appears whenever you&apos;re in a Google
          Meet, Zoom, or Microsoft Teams call. One click sends the NoteFlow notetaker — no copying
          links into the dashboard. Your meeting shows up in My Meetings, transcribed and summarized,
          exactly like a pasted capture.
        </p>

        <div className="mt-8 flex flex-col items-start gap-3">
          <a
            href="/noteflow-extension.zip"
            download
            className="vsp-btn vsp-btn-solid group inline-flex h-[44px] items-center gap-2.5 rounded-md px-5 text-sm font-medium tracking-[-0.01em]"
          >
            <DownloadGlyph />
            Download the extension
          </a>
          <p className="text-xs text-muted">Free · Chrome &amp; Edge · one-click capture in Meet, Zoom &amp; Teams</p>
        </div>

        {/* A real sequence, so numbered steps earn their place. */}
        <ol className="mt-12 space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-4 rounded-xl border border-border bg-surface/40 px-4 py-3.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-surface text-sm font-medium tabular-nums text-foreground">
                {i + 1}
              </span>
              <p className="pt-1 text-sm leading-relaxed text-foreground/85">{step}</p>
            </li>
          ))}
        </ol>

        <p className="mt-8 max-w-xl text-xs leading-relaxed text-muted">
          Chrome doesn&apos;t let websites install extensions directly, so it takes one manual setup —
          about a minute. A Chrome Web Store listing (true one-click install) is the next step.
        </p>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-surface/30 p-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" aria-hidden="true">
            <path d="m5 13 4 4L19 7" />
          </svg>
          <p className="text-sm leading-relaxed text-muted">
            No extension? Everything still works — paste a meeting link with{" "}
            <Link href="/app/meetings" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">Capture</Link>{" "}
            in the dashboard and NoteFlow joins the same way.
          </p>
        </div>
      </main>
    </div>
  );
}
