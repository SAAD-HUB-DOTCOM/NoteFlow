"use client";

import { useEffect, useRef, useState } from "react";
import { ShareIcon, CheckIcon, CloseIcon } from "@/components/icons";

/**
 * Entry point to the public share flow: reveals the read-only /share/[id] link and copies it.
 * The link is built from the live origin on the client, so it's correct in preview and prod.
 */
export function ShareButton({ meetingId }: { meetingId: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLink(`${window.location.origin}/share/${meetingId}`);
  }, [meetingId]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
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
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context) — the link stays visible to copy manually.
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 rounded-lg bg-[#F2F2EF] px-3.5 py-2 text-sm font-medium text-[#0A0A0A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-transform duration-150 hover:-translate-y-px"
      >
        <ShareIcon className="h-4 w-4" />
        Share
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Share this meeting"
          className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-4 shadow-xl shadow-black/30"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Share meeting</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="grid h-6 w-6 place-items-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-muted">
            Anyone with this link can view a read-only version — summary, transcript, and action
            items. No sign-in needed.
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              aria-label="Share link"
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-foreground/80"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F2F2EF] px-3 py-2 text-xs font-medium text-[#0A0A0A] transition-transform duration-150 hover:-translate-y-px"
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5" /> : null}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
