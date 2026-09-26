"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CloseIcon } from "@/components/icons";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#ask", label: "Ask NoteFlow" },
  { href: "#teams", label: "For teams" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Drawer behavior: lock page scroll while open, close on Escape, and move focus into the
  // dialog on open / back to the trigger on close (so keyboard users never lose their place).
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [open]);

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
          <Link
            href="/product"
            className="rounded-lg"
            aria-label="NoteFlow home"
          >
            <Logo />
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="vsp-navlink inline-flex h-10 items-center rounded-[7px] px-[18px] text-sm tracking-[-0.01em] text-[#f3f3f3]"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:block"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="vsp-btn vsp-btn-solid inline-flex h-10 items-center rounded-md px-4 text-[13.5px] font-medium tracking-[-0.02em]"
            >
              Start for free
            </Link>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition-colors hover:text-foreground md:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="landing-menu-drawer"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile/tablet drawer: dimmed backdrop + panel sliding in from the right. Kept mounted
          so both open and close animate; inert (pointer-events-none) while closed. */}
      <div
        className={`fixed inset-0 z-[60] md:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          id="landing-menu-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute right-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col border-l border-white/10 bg-[#0A0A0B] shadow-[-24px_0_60px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <Logo />
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition-colors hover:text-foreground"
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-3.5 font-display text-[15px] text-foreground transition-colors hover:bg-white/[0.05]"
              >
                {l.label}
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-muted"
                  aria-hidden="true"
                >
                  <path d="M5.75 3.75 10.25 8l-4.5 4.25" />
                </svg>
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-2.5 border-t border-white/[0.07] px-5 py-5">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="vsp-btn vsp-btn-solid inline-flex h-11 items-center justify-center rounded-md text-sm font-medium tracking-[-0.01em]"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="vsp-btn vsp-btn-ghost inline-flex h-11 items-center justify-center rounded-md text-sm font-medium tracking-[-0.01em]"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
