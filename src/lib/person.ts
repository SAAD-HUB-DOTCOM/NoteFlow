import { initialsFrom } from "@/lib/format";

/** The identity fields the People surfaces derive display from — never inferred, only what's real. */
type IdentityFields = { display_name: string | null; email: string | null };

/**
 * Truthful display name for a resolved person:
 *   real display_name → the email (when that's all we have) → an honest neutral label.
 * Never fabricates a name.
 */
export function personDisplayName(p: IdentityFields): string {
  return p.display_name?.trim() || p.email?.trim() || "Unnamed person";
}

/**
 * Restrained initials for the identity mark: initials from a real name, else the first letter of
 * the email, else null (the mark falls back to a neutral glyph rather than inventing letters).
 */
export function personInitials(p: IdentityFields): string | null {
  if (p.display_name?.trim()) return initialsFrom(p.display_name);
  const email = p.email?.trim();
  if (email) return email[0]!.toUpperCase();
  return null;
}
