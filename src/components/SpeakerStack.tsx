/**
 * Overlapping initial-avatars. Communicates who was on the call and how many, at a glance —
 * more legible than an "8 speakers" string. Neutral surface tint (no per-person rainbow, to
 * stay within the design system's single-accent rule); the ring matches the card background so
 * overlaps read cleanly.
 */
export function SpeakerStack({
  people,
  max = 4,
}: {
  people: { id: string; name: string; initials: string }[];
  max?: number;
}) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((p) => (
          <span
            key={p.id}
            title={p.name}
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-surface-hover text-[0.65rem] font-medium text-foreground/90 ring-1 ring-border/60"
          >
            {p.initials}
          </span>
        ))}
        {overflow > 0 && (
          <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-background text-[0.65rem] font-medium text-muted ring-1 ring-border/60">
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}
