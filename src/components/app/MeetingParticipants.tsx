"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  apiFetch,
  ApiError,
  createPerson,
  type MeetingParticipantDTO,
} from "@/lib/api";
import { PersonMark } from "@/components/app/PersonMark";
import { ChevronRightIcon } from "@/components/icons";

/**
 * Participants for a meeting (Phase 6E). Lists the real observed participants Recall separated, and
 * lets you turn one into a resolved Person via the existing create/link endpoints — the honest way
 * to populate People when a meeting carries no email. No fabricated identities: a participant is
 * only promoted when you explicitly name it.
 */
export function MeetingParticipants({ meetingId }: { meetingId: string }) {
  const [rows, setRows] = useState<MeetingParticipantDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await apiFetch<MeetingParticipantDTO[]>(`/api/v1/meetings/${meetingId}/participants`));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load participants.");
    }
  }, [meetingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const startIdentify = (p: MeetingParticipantDTO) => {
    setEditing(p.id);
    setName(p.display_name ?? "");
    setError(null);
  };

  const submit = useCallback(
    async (participantId: string) => {
      const n = name.trim();
      if (!n || saving) return;
      setSaving(true);
      try {
        await createPerson({ meeting_participant_id: participantId, display_name: n });
        setEditing(null);
        await load();
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Couldn’t identify this participant.");
      } finally {
        setSaving(false);
      }
    },
    [name, saving, load],
  );

  // Nothing to show for meetings with no observed participants yet (still recording / historical).
  if (!rows || rows.length === 0) return null;

  return (
    <div className="mb-9">
      <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] nf-tf">
        Participants
      </h2>
      <ul className="flex flex-col gap-1">
        {rows.map((p) => {
          const label = p.display_name || p.speaker_label || "Unnamed speaker";
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-lg px-1.5 py-2">
              <PersonMark displayName={p.display_name} email={p.email} avatarUrl={null} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm nf-t" dir="auto">{label}</p>

                {p.person_id ? (
                  <Link
                    href={`/app/people/${p.person_id}`}
                    className="group inline-flex items-center gap-1 text-xs nf-t2 transition-colors hover:text-[color:var(--nf-text)]"
                  >
                    Identified as {p.person_display_name || label}
                    <ChevronRightIcon className="h-3 w-3 nf-tm transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : editing === p.id ? (
                  <form
                    className="mt-1.5 flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submit(p.id);
                    }}
                  >
                    <div className="nf-input flex min-w-0 flex-1 items-center px-3 py-1.5">
                      <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        aria-label="Person name"
                        dir="auto"
                        maxLength={120}
                        className="w-full bg-transparent text-sm nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!name.trim() || saving}
                      className="nf-btn-primary shrink-0 px-3 py-1.5 text-xs disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="shrink-0 text-xs nf-tm transition-colors hover:text-[color:var(--nf-text)]"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => startIdentify(p)}
                    className="text-xs nf-t2 underline underline-offset-2 transition-colors hover:text-[color:var(--nf-text)]"
                  >
                    Identify
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {error && <p className="mt-2 text-xs" style={{ color: "var(--nf-failed)" }}>{error}</p>}
      <div className="mt-6 border-t" style={{ borderColor: "var(--nf-hairline)" }} />
    </div>
  );
}
