"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError, type MeetingDTO } from "@/lib/api";
import { MicIcon, CloseIcon } from "@/components/icons";

/**
 * Opens a modal to paste a Meet/Zoom/Teams URL and sends a NoteFlow bot via the backend
 * capture endpoint (Phase 3). Shows truthful states — no fake success on failure.
 */
export function RecordMeetingButton({
  label = "Record meeting",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const base =
    "inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover";
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? base}>
        <MicIcon className="h-4 w-4" />
        {label}
      </button>
      {open && <RecordModal onClose={() => setOpen(false)} />}
    </>
  );
}

type Phase = "form" | "submitting" | "done";

function RecordModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<MeetingDTO | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setPhase("submitting");
    setError(null);
    try {
      const created = await apiFetch<MeetingDTO>("/api/v1/meetings/capture", {
        method: "POST",
        body: JSON.stringify({ meeting_url: url.trim() }),
      });
      setMeeting(created);
      setPhase("done");
      router.refresh(); // pick up the new meeting once the list is live (Phase 6)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      setError(msg);
      setPhase("form");
    }
  }

  return (
    <div
      className="nf-app fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Record a meeting"
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl shadow-black/60"
        style={{ background: "var(--nf-surface-2)", border: "1px solid var(--nf-border)" }}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-medium nf-t">Capture a meeting</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="nf-btn-ghost grid h-7 w-7 place-items-center rounded-md"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {phase === "done" && meeting ? (
          <div>
            <p className="text-sm leading-relaxed nf-t">
              NoteFlow is joining your meeting. You’ll see it here as it moves through{" "}
              <span className="nf-tm">joining → recording → ready</span>.
            </p>
            <p className="mt-2 text-xs nf-tm">
              Current status: <span className="nf-t">{meeting.status}</span>
            </p>
            <button
              type="button"
              onClick={onClose}
              className="nf-btn-primary mt-5 w-full px-4 py-2.5 text-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="mb-3 text-sm leading-relaxed nf-tm">
              Paste a Google Meet, Zoom, or Microsoft Teams link. A NoteFlow notetaker will join
              and record it. You’re responsible for any recording consent required.
            </p>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://meet.google.com/…"
              aria-label="Meeting URL"
              className="nf-input w-full px-3.5 py-2.5 text-sm nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none"
            />
            {error && <p className="mt-2 text-xs" style={{ color: "var(--nf-failed)" }}>{error}</p>}
            <button
              type="submit"
              disabled={phase === "submitting" || !url.trim()}
              className="nf-btn-primary mt-4 flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60"
            >
              <MicIcon className="h-4 w-4" />
              {phase === "submitting" ? "Sending notetaker…" : "Send NoteFlow notetaker"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
