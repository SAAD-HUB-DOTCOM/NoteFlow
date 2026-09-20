import { statusKind, statusLabel, type StatusKind } from "@/lib/meetingStatus";

const DOT: Record<StatusKind, string> = {
  live: "bg-primary",
  processing: "bg-primary",
  ready: "bg-accent",
  failed: "bg-danger",
};

/** Truthful status pill for a real meeting (live / transcribing / ready / failed). */
export function StatusChip({ status }: { status: string }) {
  const kind = statusKind(status);
  const pulse = kind === "live" || kind === "processing";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        className={`h-1.5 w-1.5 rounded-full ${DOT[kind]} ${pulse ? "animate-pulse" : ""}`}
        aria-hidden="true"
      />
      {statusLabel(status)}
    </span>
  );
}
