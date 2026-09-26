import { personInitials } from "@/lib/person";
import { UsersIcon } from "@/components/icons";

/**
 * The restrained identity mark for a person. Uses a real avatar_url when present; otherwise a
 * graphite disc with initials derived from the real name/email. When neither exists it shows a
 * neutral glyph — never invented initials, never a fake avatar.
 */
export function PersonMark({
  displayName,
  email,
  avatarUrl,
  size = "md",
  className = "",
}: {
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  size?: "md" | "lg";
  className?: string;
}) {
  const dim = size === "lg" ? "h-14 w-14" : "h-10 w-10";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external, unknown-size avatar
      <img
        src={avatarUrl}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover ${className}`}
        style={{ border: "1px solid var(--nf-border)" }}
      />
    );
  }

  const initials = personInitials({ display_name: displayName, email });
  return (
    <div
      className={`grid ${dim} shrink-0 place-items-center rounded-full ${className}`}
      style={{ background: "var(--nf-surface-3)", border: "1px solid var(--nf-border)" }}
      aria-hidden="true"
    >
      {initials ? (
        <span className={`font-medium tracking-wide nf-t2 ${size === "lg" ? "text-base" : "text-[13px]"}`}>
          {initials}
        </span>
      ) : (
        <UsersIcon className={size === "lg" ? "h-6 w-6 nf-tm" : "h-[18px] w-[18px] nf-tm"} />
      )}
    </div>
  );
}
