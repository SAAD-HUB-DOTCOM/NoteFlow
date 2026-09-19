import Link from "next/link";
import { Logo } from "@/components/Logo";

/** Branded 404 — reached when a meeting/share id doesn't exist. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-4 sm:px-6">
          <Logo />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <p className="text-sm font-medium text-muted">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          We couldn’t find that meeting
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          The link may be wrong, or the meeting isn’t part of this workspace.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Back to My Meetings
        </Link>
      </main>
    </div>
  );
}
