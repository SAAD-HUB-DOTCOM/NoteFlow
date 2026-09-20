"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Primary sections of the app, mirroring the reference's tab row. All areas are live: My Meetings,
 * Highlights and Action items (rolled up from real AI intelligence), and Shared (public links).
 */
const TABS = [
  { label: "My Meetings", href: "/app/meetings" },
  { label: "Highlights", href: "/app/highlights" },
  { label: "Action items", href: "/app/action-items" },
  { label: "Shared", href: "/app/shared" },
];

export function AppTabs() {
  return (
    <nav className="border-b border-border bg-background/60">
      <div className="mx-auto flex max-w-[1400px] items-center gap-7 px-4 sm:px-6">
        {TABS.map((t) => (
          <AppTab key={t.label} href={t.href} label={t.label} />
        ))}
      </div>
    </nav>
  );
}

function AppTab({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px border-b-2 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
