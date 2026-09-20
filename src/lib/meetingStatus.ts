/** Map the backend meeting lifecycle status to a UI kind + human label (truthful states). */
export type StatusKind = "live" | "processing" | "ready" | "failed";

export function statusKind(status: string): StatusKind {
  if (status === "ready") return "ready";
  if (status === "failed" || status === "cancelled") return "failed";
  if (["recording_complete", "transcribing", "generating_intelligence"].includes(status)) {
    return "processing";
  }
  // draft, scheduled, bot_scheduled, joining, in_waiting_room, recording
  return "live";
}

const LABELS: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  bot_scheduled: "Scheduled",
  joining: "Joining call",
  in_waiting_room: "Waiting to be admitted",
  recording: "Recording",
  recording_complete: "Processing recording",
  transcribing: "Transcribing",
  generating_intelligence: "Transcribing",
  ready: "Ready",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function statusLabel(status: string): string {
  return LABELS[status] ?? status;
}

/** Whether we should keep polling the backend for this meeting (still in flight). */
export function isInFlight(status: string): boolean {
  const kind = statusKind(status);
  return kind === "live" || kind === "processing";
}
