"use client";

import { useState } from "react";
import { apiFetch, ApiError, type ShareDTO } from "@/lib/api";
import { ShareIcon } from "@/components/icons";

/**
 * Share control for a meeting: mints a public read-only link (POST /meetings/{id}/share), lets the
 * owner copy or revoke it. The link is a capability — anyone with it can read the meeting — so the
 * panel says so plainly.
 */
export function ShareControl({
  meetingId,
  initialShareId,
}: {
  meetingId: string;
  initialShareId: string | null;
}) {
  const [shareId, setShareId] = useState<string | null>(initialShareId);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url =
    shareId && typeof window !== "undefined" ? `${window.location.origin}/s/${shareId}` : "";

  const onClick = async () => {
    setError(null);
    if (shareId) {
      setOpen((o) => !o);
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch<ShareDTO>(`/api/v1/meetings/${meetingId}/share`, { method: "POST" });
      setShareId(res.share_id);
      setOpen(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t create a share link.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — link stays visible to copy manually */
    }
  };

  const revoke = async () => {
    setBusy(true);
    try {
      await apiFetch<ShareDTO>(`/api/v1/meetings/${meetingId}/share`, { method: "DELETE" });
      setShareId(null);
      setOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t revoke the link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={busy}
        className="nf-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium disabled:opacity-60"
      >
        <ShareIcon className="h-4 w-4" />
        {shareId ? "Shared" : "Share"}
      </button>

      {open && shareId && (
        <div
          className="absolute right-0 z-30 mt-2 w-80 rounded-xl p-3.5 shadow-xl shadow-black/50"
          style={{ background: "var(--nf-surface-2)", border: "1px solid var(--nf-border)" }}
        >
          <p className="text-xs leading-relaxed nf-tm">
            Anyone with this link can view this meeting’s transcript and summary — no sign-in needed.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-xs nf-t2" style={{ background: "var(--nf-bg)", border: "1px solid var(--nf-border)" }}>
              {url}
            </code>
            <button
              type="button"
              onClick={() => void copy()}
              className="nf-btn-primary shrink-0 px-2.5 py-1.5 text-xs"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => void revoke()}
            disabled={busy}
            className="mt-2.5 text-xs font-medium transition-colors hover:underline disabled:opacity-60"
            style={{ color: "var(--nf-failed)" }}
          >
            Revoke link
          </button>
        </div>
      )}

      {error && <p className="absolute right-0 mt-2 text-xs" style={{ color: "var(--nf-failed)" }}>{error}</p>}
    </div>
  );
}
