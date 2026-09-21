"use client";

import { useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  // Transparent over the cosmic hero at the top; a frosted bar as soon as the page scrolls, so
  // content slides beneath frosted glass instead of a see-through bar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sticky top-0 z-50">
      <header
        className={`transition-colors duration-300 ${
          scrolled
            ? "border-b border-border/50 bg-background/80 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/product" className="rounded-lg" aria-label="NoteFlow home">
            <Logo />
          </Link>

          <div className="glass-pill hidden items-center gap-1 rounded-full px-2 py-1.5 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-1.5 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground"
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
              className="btn-grad px-4 py-2 text-sm font-semibold uppercase tracking-wide"
            >
              Sign up free
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
