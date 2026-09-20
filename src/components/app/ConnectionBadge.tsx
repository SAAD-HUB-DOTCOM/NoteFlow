"use client";

import { useMeetingsRealtime } from "@/components/app/RealtimeProvider";

/** Subtle real-time connection indicator — hidden when healthy, shown while re-establishing. */
export function ConnectionBadge() {
  const { status } = useMeetingsRealtime();
  if (status === "connected") return null;

  const label =
    status === "connecting"
      ? "Connecting…"
      : status === "reconnecting"
        ? "Reconnecting…"
        : "Live updates offline";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "disconnected" ? "bg-danger" : "bg-primary animate-pulse"
        }`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
