/**
 * Profile display resolution (Phase 7B). Establishes the explicit fallback order for the app's
 * profile identity, keeping it in one place so Settings and the Sidebar agree:
 *
 *   display name:  Profile.display_name → Supabase full_name/name → email-derived readable → generic
 *   avatar:        Profile.avatar_url → Supabase avatar/picture → (initials/neutral, handled by mark)
 *
 * `/api/v1/me` is authoritative for the NoteFlow profile; the auth session provides only the
 * fallbacks (session name / OAuth avatar) and the authenticated email.
 */

/** A readable, clearly self-derived label from the user's OWN email local part, or null. */
export function emailReadable(email: string | null): string | null {
  if (!email) return null;
  const local = email.split("@")[0] ?? "";
  const words = local.replace(/[._+-]+/g, " ").trim();
  if (!/[a-zA-Z]/.test(words)) return null;
  return words
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** The resolved display name — always a non-empty string (last resort: a generic label). */
export function resolveDisplayName(
  profileName: string | null,
  sessionName: string | null,
  email: string | null,
): string {
  return (
    profileName?.trim() ||
    sessionName?.trim() ||
    emailReadable(email) ||
    "Your account"
  );
}
