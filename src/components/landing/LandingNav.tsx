"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CloseIcon } from "@/components/icons";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#ask", label: "Ask NoteFlow" },
  { href: "#teams", label: "For teams" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Cosmic marketing nav: a thin announcement rail over a floating pill of links, matching the
 * reference's chrome. The links live in a bordered capsule so the bar reads as one object over
 * the starfield; the mobile toggle opens a short inline sheet rather than a full drawer.
 */
export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50">
      <header className="border-b border-border/50 bg-background/70 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/product" className="rounded-lg" aria-label="NoteFlow home">
            <Logo />
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-border/80 bg-surface/60 px-2 py-1.5 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-1.5 font-display text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden font-display text-sm font-medium text-muted transition-colors hover:text-foreground sm:block"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-primary px-4 py-2 font-display text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-hover"
            >
              Get started free
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? (
                <CloseIcon className="h-5 w-5" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {open && (
          <div className="border-t border-border bg-background px-4 py-3 md:hidden">
            <div className="flex flex-col">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 font-display text-sm text-foreground transition-colors hover:bg-surface-hover"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
