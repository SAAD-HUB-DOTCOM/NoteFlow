"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

/** Compact, quiet dropdown (e.g. "All meetings ▾") used across the Phase 4 output screens. */
export function SelectMenu({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const current = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="inline-flex max-w-[220px] items-center gap-2 rounded-full px-3.5 py-2 text-[13px] nf-t2 transition-colors hover:text-[color:var(--nf-text)]"
        style={{ background: "var(--nf-surface-1)", border: "1px solid var(--nf-border)" }}
      >
        <span className="truncate">{current}</span>
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 nf-tf" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-30 max-h-72 w-56 overflow-y-auto rounded-xl border py-1 shadow-xl shadow-black/50"
          style={{ background: "var(--nf-surface-2)", borderColor: "var(--nf-border)" }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={value === o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`block w-full truncate px-4 py-2 text-left text-[13px] transition-colors hover:bg-[var(--nf-surface-hover)] ${value === o.value ? "nf-t" : "nf-t2"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
