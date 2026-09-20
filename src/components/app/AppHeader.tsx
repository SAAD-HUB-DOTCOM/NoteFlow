import Link from "next/link";
import { Logo } from "@/components/Logo";
import { RecordMeetingButton } from "@/components/app/RecordMeetingButton";
import { AccountMenu } from "@/components/app/AccountMenu";
import { SearchIcon, SettingsIcon, HelpIcon } from "@/components/icons";

/** Authenticated app chrome: brand, meeting search, capture entry, and account. */
export function AppHeader({ email }: { email: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/app/meetings" aria-label="NoteFlow — My Meetings" className="shrink-0">
          <Logo />
        </Link>

        {/* meeting search — the primary way people re-find a call */}
        <div className="relative hidden max-w-md flex-1 sm:block">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search meetings"
            aria-label="Search meetings"
            className="w-full rounded-lg border border-border bg-surface/70 py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted transition-colors focus:border-primary focus:outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <RecordMeetingButton />
          <button
            type="button"
            aria-label="Settings"
            title="Settings"
            className="hidden h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground sm:grid"
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Help and feedback"
            title="Help & feedback"
            className="hidden h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground sm:grid"
          >
            <HelpIcon className="h-5 w-5" />
          </button>
          <AccountMenu email={email} />
        </div>
      </div>
    </header>
  );
}
