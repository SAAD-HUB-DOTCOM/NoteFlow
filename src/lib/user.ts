/** A friendly first-name from an email local part: "saad@noteflow.com" → "Saad". */
export function nameFromEmail(email: string | null | undefined): string {
  if (!email) return "there";
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[.\-_+]/)[0] ?? local;
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}
