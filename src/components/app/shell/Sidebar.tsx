"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/components/app/ProfileProvider";
import {
  UsersIcon,
  BookmarkIcon,
  ChecklistIcon,
  ShareIcon,
  SettingsIcon,
  SparkleIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "@/components/icons";

type SvgProps = React.SVGProps<SVGSVGElement>;

function HomeIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V20h12V9.5" />
    </svg>
  );
}
function MeetingsIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="6" width="12" height="12" rx="2.5" />
      <path d="m15 10 6-3v10l-6-3" />
    </svg>
  );
}

const GROUPS: { items: { href: string; label: string; icon: (p: SvgProps) => React.ReactElement }[] }[] = [
  {
    items: [
      { href: "/app", label: "Home", icon: HomeIcon },
      { href: "/app/meetings", label: "Meetings", icon: MeetingsIcon },
      { href: "/app/intelligence", label: "Intelligence", icon: SparkleIcon },
      { href: "/app/people", label: "People", icon: UsersIcon },
    ],
  },
  {
    items: [
      { href: "/app/highlights", label: "Highlights", icon: BookmarkIcon },
      { href: "/app/action-items", label: "Action items", icon: ChecklistIcon },
      { href: "/app/shared", label: "Shared", icon: ShareIcon },
    ],
  },
  {
    items: [{ href: "/app/settings", label: "Settings", icon: SettingsIcon }],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        style={{ background: "var(--nf-bg)", borderColor: "var(--nf-border)" }}
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] shrink-0 flex-col border-r transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center px-5">
          <Link href="/app" onClick={onClose} className="font-display text-[1.15rem] leading-none tracking-[-0.02em] nf-t">
            <span className="font-semibold">Note</span>
            <span className="font-normal">Flow</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {GROUPS.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="my-3 border-t" style={{ borderColor: "var(--nf-hairline)" }} />}
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={`nf-nav text-[13.5px] ${active ? "font-medium" : "font-normal nf-t2"}`}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom region — Upgrade + account grouped by a single hairline, not separate cards */}
        <div className="mt-auto border-t px-3 py-3" style={{ borderColor: "var(--nf-hairline)" }}>
          <Link
            href="/app/settings"
            onClick={onClose}
            className="mb-1 flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-[var(--nf-surface-hover)]"
          >
            <SparkleIcon className="h-4 w-4 shrink-0 nf-tm" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium nf-t2">Upgrade to Pro</span>
              <span className="block truncate text-[11px] nf-tf">More history &amp; team search</span>
            </span>
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 nf-tf" />
          </Link>
          <AccountBlock />
        </div>
      </aside>
    </>
  );
}

function AccountBlock() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Shared NoteFlow profile — reflects a name edited in Settings without a reload.
  const { displayName, email } = useProfile();
  const primary = displayName;
  const initial = (displayName.trim()[0] ?? email?.trim()?.[0] ?? "N").toUpperCase();

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      {open && (
        <div
          role="menu"
          className="absolute bottom-[52px] left-0 right-0 z-50 overflow-hidden rounded-xl border shadow-xl shadow-black/50"
          style={{ background: "var(--nf-surface-2)", borderColor: "var(--nf-border)" }}
        >
          <form action="/auth/signout" method="post">
            <button type="submit" role="menuitem" className="w-full px-4 py-2.5 text-left text-sm nf-t transition-colors hover:bg-[var(--nf-surface-hover)]">
              Sign out
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-[var(--nf-surface-hover)]"
      >
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold nf-t"
          style={{ background: "var(--nf-surface-3)", border: "1px solid var(--nf-border)" }}
        >
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium nf-t">{primary}</span>
          {email && email !== primary && (
            <span className="block truncate text-[11px] nf-tm">{email}</span>
          )}
        </span>
        <ChevronUpIcon className="h-4 w-4 shrink-0 nf-tf" />
      </button>
    </div>
  );
}
