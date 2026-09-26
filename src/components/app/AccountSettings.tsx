"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { useProfile } from "@/components/app/ProfileProvider";
import { PersonMark } from "@/components/app/PersonMark";

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Account settings (Phase 7B) — the only genuinely supported settings today: view your email
 * (read-only), edit your NoteFlow display name (PATCH /api/v1/me), and sign out. Deliberately
 * sparse: no fake toggles, plans, integrations, or avatar-upload controls the backend can't honor.
 */
export function AccountSettings() {
  const { email, displayName, profileName, avatarUrl, loading, updateDisplayName } = useProfile();

  const [value, setValue] = useState(profileName ?? "");
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Keep the field in sync with the authoritative profile until the user starts editing.
  useEffect(() => {
    if (!dirty) setValue(profileName ?? "");
  }, [profileName, dirty]);

  const trimmed = value.trim();
  const baseline = (profileName ?? "").trim();
  const changed = trimmed !== baseline;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!changed || state === "saving" || loading) return;
    setState("saving");
    setError(null);
    try {
      await updateDisplayName(trimmed);
      setDirty(false);
      setState("saved");
    } catch (err) {
      setState("error");
      setError(err instanceof ApiError ? err.message : "Couldn’t save your name. Try again.");
    }
  }

  return (
    <div className="flex flex-col gap-12">
      {/* Profile */}
      <section>
        <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] nf-tf">Profile</h2>
        <div className="mt-1.5 border-t" style={{ borderColor: "var(--nf-hairline)" }} />

        <div className="mt-6 flex items-start gap-5">
          <PersonMark displayName={displayName} email={email} avatarUrl={avatarUrl} size="lg" />

          <div className="min-w-0 flex-1" style={{ maxWidth: "26rem" }}>
            <form onSubmit={onSubmit}>
              <label
                htmlFor="display-name"
                className="block text-[11px] font-medium uppercase tracking-[0.14em] nf-tf"
              >
                Display name
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="nf-input flex min-w-0 flex-1 items-center px-3.5 py-2.5">
                  <input
                    id="display-name"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      setDirty(true);
                      if (state !== "idle") setState("idle");
                    }}
                    disabled={loading}
                    maxLength={120}
                    placeholder={loading ? "Loading…" : profileName ? undefined : displayName}
                    aria-label="Display name"
                    dir="auto"
                    className="w-full bg-transparent text-sm nf-t placeholder:text-[color:var(--nf-text-muted)] focus:outline-none disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!changed || state === "saving" || loading}
                  className="nf-btn-primary shrink-0 px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {state === "saving" ? "Saving…" : "Save"}
                </button>
              </div>
              <div className="mt-2 min-h-[1rem] text-xs" aria-live="polite">
                {state === "saved" && <span className="nf-tm">Saved.</span>}
                {state === "error" && error && (
                  <span style={{ color: "var(--nf-failed)" }}>{error}</span>
                )}
                {state === "idle" && !profileName && !loading && (
                  <span className="nf-tf">Currently showing “{displayName}”. Set a name to personalize it.</span>
                )}
              </div>
            </form>

            <div className="mt-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] nf-tf">Email</p>
              <p className="mt-2 truncate text-sm nf-t" dir="auto">{email ?? "—"}</p>
              <p className="mt-1 text-xs nf-tf">Managed by your sign-in provider.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Account */}
      <section>
        <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] nf-tf">Account</h2>
        <div className="mt-1.5 border-t" style={{ borderColor: "var(--nf-hairline)" }} />

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs nf-tm">Signed in as</p>
            <p className="truncate text-sm nf-t" dir="auto">{email ?? "your account"}</p>
          </div>
          {/* Reuse the existing, working sign-out flow — no second auth mechanism. */}
          <form action="/auth/signout" method="post">
            <button type="submit" className="nf-btn-secondary shrink-0 px-4 py-2.5 text-sm">
              Sign out
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
