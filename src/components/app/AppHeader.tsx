import Link from "next/link";
import { Logo } from "@/components/Logo";
import { RecordMeetingButton } from "@/components/app/RecordMeetingButton";

/** Authenticated app chrome: brand, (soon) capture entry, account + sign out. */
export function AppHeader({ email }: { email: string | null }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/app/meetings" aria-label="NoteFlow — My Meetings">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <RecordMeetingButton />
          {email && (
            <span className="hidden max-w-[12rem] truncate text-sm text-muted sm:inline">
              {email}
            </span>
          )}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
