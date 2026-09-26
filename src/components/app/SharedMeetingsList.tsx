"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, type MeetingDTO, type ShareDTO } from "@/lib/api";
import { ShareIcon, SearchIcon } from "@/components/icons";
import { EmptyCard, ErrorCard, ListSkeleton, ListNoResults } from "@/components/app/ActionItemsList";

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
function shortDate(v: string | null): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : SHORT_DATE.format(d);
}

/**
 * Shared — a distribution/access ledger of the public read-only links the user has created.
 * The list is meetings that currently have a `share_id` (GET /api/v1/meetings, filtered); revoked
 * links null their share_id and are not retrievable, so there's no revoked history to show. Only
 * real fields are surfaced: meeting, meeting date, URL. Create/copy/revoke are the existing flows.
 */
export function SharedMeetingsList() {
  const [meetings, setMeetings] = useState<MeetingDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const all = await apiFetch<MeetingDTO[]>("/api/v1/meetings");
      setMeetings(all.filter((m) => m.share_id));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load your shared meetings.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const publicUrl = (shareId: string) =>
    typeof window === "undefined" ? `/s/${shareId}` : `${window.location.origin}/s/${shareId}`;

  const copy = async (shareId: string) => {
    try {
      await navigator.clipboard.writeText(publicUrl(shareId));
      setCopied(shareId);
      setTimeout(() => setCopied((c) => (c === shareId ? null : c)), 2000);
    } catch {
      /* clipboard blocked — the link is still visible to select manually */
    }
  };

  const revoke = async (meetingId: string) => {
    await apiFetch<ShareDTO>(`/api/v1/meetings/${meetingId}/share`, { method: "DELETE" });
    void load();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meetings ?? [];
    return (meetings ?? []).filter((m) => (m.title || "Untitled meeting").toLowerCase().includes(q));
  }, [meetings, query]);

  if (error) return <ErrorCard message={error} />;
  if (!meetings) return <ListSkeleton />;
  if (meetings.length === 0) {
    return (
      <EmptyCard
        icon={<ShareIcon className="h-5 w-5 nf-tm" />}
        title="Nothing shared yet"
        body="Open a meeting and use Share to create a public read-only link. The links you make available outside NoteFlow collect here."
      />
    );
  }

  return (
    <div>
      <div className="nf-input flex max-w-md items-center gap-2.5 px-4 py-2.5">
        <SearchIcon className="h-4 w-4 shrink-0 nf-tm" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shared meetings…"
          aria-label="Search shared meetings"
          className="w-full bg-transparent text-sm nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <ListNoResults onClear={() => setQuery("")} />
      ) : (
        <div className="mt-6">
          <h2 className="mb-3 px-1 text-[11px] font-medium uppercase tracking-[0.16em] nf-tm">Active links</h2>
          <ul className="flex flex-col">
            {filtered.map((m, i) => {
              const date = shortDate(m.started_at ?? m.created_at);
              const url = publicUrl(m.share_id!);
              const isCopied = copied === m.share_id;
              return (
                <li key={m.id}>
                  {i > 0 && <div className="mx-1 border-t" style={{ borderColor: "var(--nf-hairline)" }} />}
                  <div className="px-1 py-6">
                    <div className="min-w-0">
                      <Link href={`/app/meetings/${m.id}`} className="text-[15px] font-medium nf-t transition-colors hover:text-[color:var(--nf-text-secondary)]">
                        {m.title || "Untitled meeting"}
                      </Link>
                      <p className="mt-0.5 text-xs nf-tm">Public · read-only{date ? ` · ${date}` : ""}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div
                        className="min-w-0 flex-1 truncate rounded-md px-3 py-1.5 font-mono text-[11.5px] nf-t2"
                        style={{ background: "var(--nf-surface-1)" }}
                        title={url}
                      >
                        {url}
                      </div>
                      <button
                        type="button"
                        onClick={() => void copy(m.share_id!)}
                        className="nf-btn-secondary shrink-0 px-3 py-1.5 text-xs"
                        style={isCopied ? { color: "var(--nf-text)", borderColor: "var(--nf-border-strong)" } : undefined}
                      >
                        {isCopied ? "Copied" : "Copy"}
                      </button>
                      <a href={url} target="_blank" rel="noreferrer" className="nf-btn-ghost shrink-0 rounded-md px-3 py-1.5 text-xs">
                        Open
                      </a>
                      <ShareRowMenu onRevoke={() => void revoke(m.id)} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function MoreIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

/** Restrained overflow (···) that keeps the destructive Revoke off the main row. */
function ShareRowMenu({ onRevoke }: { onRevoke: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onEsc); };
  }, []);
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More"
        className="nf-btn-ghost grid h-8 w-8 place-items-center rounded-md"
      >
        <MoreIcon className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-30 w-40 overflow-hidden rounded-xl border py-1 shadow-xl shadow-black/50" style={{ background: "var(--nf-surface-2)", borderColor: "var(--nf-border)" }}>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onRevoke(); }}
            className="block w-full px-4 py-2 text-left text-[13px] transition-colors hover:bg-[var(--nf-surface-hover)]"
            style={{ color: "var(--nf-failed)" }}
          >
            Revoke link
          </button>
        </div>
      )}
    </div>
  );
}
