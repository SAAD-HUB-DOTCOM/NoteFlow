/** Minimal shape of the fields we read off a Supabase user for display. */
type UserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null;

/**
 * A trustworthy human display name from authenticated metadata (e.g. Google `full_name`),
 * or null. We deliberately DO NOT manufacture a name from an email handle — a raw handle like
 * "Rajpootsaad297" reads as a consumer account, so callers fall back to a name-less greeting.
 */
export function humanDisplayName(user: UserLike): string | null {
  const meta = user?.user_metadata ?? {};
  const candidate =
    (meta.full_name as string) ||
    (meta.name as string) ||
    (meta.display_name as string) ||
    "";
  const name = typeof candidate === "string" ? candidate.trim() : "";
  if (!name) return null;
  // Reject values that are really the email/handle rather than a person's name.
  if (name.includes("@")) return null;
  if (user?.email && name.toLowerCase() === user.email.split("@")[0]?.toLowerCase()) return null;
  if (!/[a-zA-Z]/.test(name)) return null;
  // Use just the first name for the greeting's warmth.
  return name.split(/\s+/)[0];
}

/** Full display name (first + last) for the account block, or null. */
export function fullDisplayName(user: UserLike): string | null {
  const meta = user?.user_metadata ?? {};
  const candidate =
    (meta.full_name as string) || (meta.name as string) || (meta.display_name as string) || "";
  const name = typeof candidate === "string" ? candidate.trim() : "";
  if (!name || name.includes("@")) return null;
  if (!/[a-zA-Z]/.test(name)) return null;
  return name;
}
