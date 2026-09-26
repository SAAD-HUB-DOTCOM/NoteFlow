"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe, updateMe, type MeDTO } from "@/lib/api";
import { resolveDisplayName } from "@/lib/profile";

/** Server-computed seed so first paint matches SSR and no name flashes: auth email, the session
 *  display name (OAuth metadata), and the OAuth avatar. `/api/v1/me` overlays these once loaded. */
export type ProfileSeed = {
  email: string | null;
  sessionName: string | null;
  sessionAvatarUrl: string | null;
};

type ProfileContextValue = {
  /** Authenticated email (read-only). */
  email: string | null;
  /** Resolved display label (never empty). */
  displayName: string;
  /** The editable Profile.display_name, or null if unset — what the Settings field edits. */
  profileName: string | null;
  /** Resolved avatar URL (Profile → OAuth), or null → mark falls back to initials. */
  avatarUrl: string | null;
  /** True until the first /me resolves (or fails). */
  loading: boolean;
  /** Persist a new display name via PATCH /me and update shared state. Throws on failure. */
  updateDisplayName: (name: string) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}

/**
 * One shared source of NoteFlow application-profile state for the whole authenticated app, so
 * Settings and the Sidebar stay consistent and we make a single /me request. Seeded from the auth
 * session (instant paint), then made authoritative by /api/v1/me.
 */
export function ProfileProvider({
  seed,
  children,
}: {
  seed: ProfileSeed;
  children: React.ReactNode;
}) {
  const [me, setMe] = useState<MeDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setMe(await getMe());
    } catch {
      // Keep the session seed; Settings raises its own error when the user acts.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const profileName = me?.display_name ?? null;
  const displayName = resolveDisplayName(profileName, seed.sessionName, seed.email);
  const avatarUrl = me?.avatar_url ?? seed.sessionAvatarUrl ?? null;

  const updateDisplayName = useCallback(async (name: string) => {
    const updated = await updateMe({ display_name: name });
    setMe(updated);
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        email: me?.email ?? seed.email,
        displayName,
        profileName,
        avatarUrl,
        loading,
        updateDisplayName,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
