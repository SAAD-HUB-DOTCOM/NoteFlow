"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Avatar → dropdown with the account email and sign-out, the way the reference app tucks
 * account actions behind the avatar instead of spending top-bar space on them.
 */
export function AccountMenu({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (email?.trim()?.[0] ?? "N").toUpperCase();

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        className="grid h-9 w-9 place-items-center rounded-full bg-accent/20 text-sm font-semibold text-accent ring-1 ring-accent/30 transition-colors hover:bg-accent/30"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-xl shadow-black/40"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs text-muted">Signed in as</p>
            <p className="truncate text-sm font-medium text-foreground">{email ?? "your account"}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="w-full px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-surface-hover"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
