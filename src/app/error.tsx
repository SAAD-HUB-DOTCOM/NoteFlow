"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";

/**
 * Root error boundary — names what happened and offers recovery (retry / go home). Styled to the
 * theme (landing_design_skill.md): mono eyebrow, display headline ending in a period, muted copy,
 * white metallic primary + glass ghost action, and the center-shine hairline under the header.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console / server logs for debugging.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-4 sm:px-6">
          <Logo />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.10) 22%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0.10) 78%, transparent)",
          }}
        />
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <p className="font-mono text-[12.5px] tracking-[0.08em] text-muted">
          Something went wrong
        </p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
          This page couldn&rsquo;t load.
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          The page hit an unexpected error. Try again, or head back to your
          meetings.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={reset}
            className="vsp-btn vsp-btn-solid inline-flex h-[42px] items-center rounded-md px-5 text-[13.5px] font-medium tracking-[-0.01em]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="vsp-btn vsp-btn-ghost inline-flex h-[42px] items-center rounded-md px-5 text-[13.5px] font-medium tracking-[-0.01em]"
          >
            Back to My Meetings
          </Link>
        </div>
      </main>
    </div>
  );
}
