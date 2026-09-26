import { statusKind, statusLabel } from "@/lib/meetingStatus";
import { CheckIcon } from "@/components/icons";

/**
 * Quiet, monochrome status for a meeting row (REDESIGN.md §6 / §19). Uses the near-grey --nf
 * status tokens — no large colored badges. Recording/Processing get a restrained pulsing dot,
 * Ready a small check, Failed the reserved muted-red dot.
 */
export function MeetingStatus({ status }: { status: string }) {
  const kind = statusKind(status);

  if (kind === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] nf-t2">
        <CheckIcon className="h-3.5 w-3.5" style={{ color: "var(--nf-ready)" }} />
        Summary ready
      </span>
    );
  }

  let label: string;
  let dot: string;
  let pulse = false;
  if (kind === "failed") {
    label = "Failed";
    dot = "var(--nf-failed)";
  } else if (kind === "processing") {
    label = "Processing";
    dot = "var(--nf-processing)";
    pulse = true;
  } else if (status === "recording") {
    label = "Recording";
    dot = "var(--nf-live)";
    pulse = true;
  } else if (status === "joining" || status === "in_waiting_room") {
    label = statusLabel(status);
    dot = "var(--nf-live)";
    pulse = true;
  } else {
    label = "Scheduled";
    dot = "var(--nf-text-muted)";
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11.5px] nf-t2"
      style={kind === "failed" ? { color: "var(--nf-failed)" } : undefined}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${pulse ? "animate-pulse" : ""}`}
        style={{ background: dot }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
