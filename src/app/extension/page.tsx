import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MicIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "NoteFlow Chrome extension — one-click meeting capture",
  description:
    "Install the NoteFlow extension and record any Google Meet, Zoom, or Teams call in one click — no link pasting.",
};

/**
 * Self-serve install page for the capture extension. Chrome forbids sites from installing
 * extensions automatically, so until the Web Store listing is live this page hands the tester
 * the zip plus the three load-unpacked steps. The manual paste-a-link flow keeps working
 * without the extension — this is the faster path, not a requirement.
 */
export default function ExtensionPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/product" aria-label="NoteFlow home">
            <Logo />
          </Link>
          <Link
            href="/app/meetings"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            My Meetings
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Record meetings in one click
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
          With the NoteFlow extension, a small Record button appears whenever you&apos;re in a
          Google Meet, Zoom, or Microsoft Teams call. One click sends the NoteFlow notetaker —
          no copying links into the dashboard. Your meeting shows up in My Meetings, transcribed
          and summarized, exactly like a pasted capture.
        </p>

        <a
          href="/noteflow-extension.zip"
          download
          className="mt-8 inline-flex items-center gap-2.5 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <MicIcon className="h-4 w-4" />
          Download the extension (.zip)
        </a>
        <p className="mt-3 text-xs text-muted">
          Chrome doesn&apos;t let websites install extensions directly, so it takes one manual
          setup — about a minute. A Chrome Web Store listing (true one-click install) is the next
          step.
        </p>

        {/* This is a real sequence, so numbered steps earn their place. */}
        <ol className="mt-10 space-y-4">
          {[
            <>Unzip the download — you&apos;ll get a <code className="rounded bg-surface px-1.5 py-0.5 text-[0.85em] text-primary">noteflow-extension</code> folder.</>,
            <>Open <code className="rounded bg-surface px-1.5 py-0.5 text-[0.85em] text-primary">chrome://extensions</code>, turn on <strong className="text-foreground">Developer mode</strong> (top right).</>,
            <>Click <strong className="text-foreground">Load unpacked</strong> and select the unzipped folder.</>,
            <>Sign in at <Link href="/login" className="text-primary underline-offset-4 hover:underline">NoteFlow</Link> once (same Chrome profile), then join any meeting — the Record button is waiting.</>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-4 rounded-xl border border-border bg-surface/50 p-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <p className="pt-0.5 text-sm leading-relaxed text-foreground/90">{step}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-xl border border-border bg-surface/40 p-5">
          <p className="flex items-start gap-3 text-sm leading-relaxed text-muted">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            No extension? Everything still works — paste a meeting link with{" "}
            <span className="text-foreground">Record meeting</span> in the dashboard and the same
            notetaker joins.
          </p>
        </div>
      </main>
    </div>
  );
}
