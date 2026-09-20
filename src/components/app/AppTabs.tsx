import Link from "next/link";

/**
 * Primary sections of the app, mirroring the reference's tab row. Only "My Meetings" is live
 * today; the rest are labelled as the product's real upcoming areas rather than dead links, so
 * the nav stays honest about what works now.
 */
const TABS = [
  { label: "My Meetings", href: "/app/meetings", live: true },
  { label: "Highlights", live: false },
  { label: "Action items", live: false },
  { label: "Shared", live: false },
];

export function AppTabs() {
  return (
    <nav className="border-b border-border bg-background/60">
      <div className="mx-auto flex max-w-[1400px] items-center gap-7 px-4 sm:px-6">
        {TABS.map((t) =>
          t.live ? (
            <Link
              key={t.label}
              href={t.href!}
              aria-current="page"
              className="-mb-px border-b-2 border-primary py-3 text-sm font-medium text-foreground"
            >
              {t.label}
            </Link>
          ) : (
            <span
              key={t.label}
              title="Coming soon"
              className="inline-flex items-center gap-1.5 border-b-2 border-transparent py-3 text-sm font-medium text-muted"
            >
              {t.label}
              <span className="rounded bg-surface px-1.5 py-0.5 text-[0.65rem] font-medium text-muted">
                Soon
              </span>
            </span>
          ),
        )}
      </div>
    </nav>
  );
}
