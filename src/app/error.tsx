"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";

/** Root error boundary — names what happened and offers recovery (retry / go home). */
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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-4 sm:px-6">
          <Logo />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-foreground">Something broke on this page</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          The page hit an unexpected error. Try again, or head back to your meetings.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            Back to My Meetings
          </Link>
        </div>
      </main>
    </div>
  );
}
