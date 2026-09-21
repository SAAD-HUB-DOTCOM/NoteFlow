/**
 * NoteFlow brand mark + wordmark. The mark is an original waveform-into-flow motif in the
 * indigo primary — it echoes the recording waveform on the meeting cards, tying the brand to
 * the product's core object. The wordmark stays a single foreground weight (no gradient text,
 * no one-word accent — both are called-out tells); the mark carries the color.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="28" height="28" rx="8" fill="#0E0E10" stroke="#2A2A2A" />
        {/* waveform bars rising left→right, resolving into the tall accent bar */}
        <rect x="7" y="15" width="2.4" height="4" rx="1.2" fill="#9600FF" opacity="0.5" />
        <rect x="11" y="11" width="2.4" height="8" rx="1.2" fill="#9600FF" opacity="0.8" />
        <rect x="15" y="7" width="2.4" height="14" rx="1.2" fill="#9600FF" />
        <rect x="19" y="12.5" width="2.4" height="5" rx="1.2" fill="#00BEFF" opacity="0.9" />
      </svg>
      <span className="text-[1.075rem] font-semibold tracking-tight text-foreground">
        NoteFlow
      </span>
    </span>
  );
}
