import { Fragment } from "react";

/**
 * Renders `text` with every case-insensitive occurrence of `query` subtly tinted. Used by
 * transcript search and cross-meeting results. The highlight is a faint indigo wash — a
 * functional match marker, deliberately quiet (craft floor: keep search highlights subtle).
 */
export function HighlightedText({
  text,
  query,
  className = "",
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const q = query.trim();
  if (!q) return <span className={className}>{text}</span>;

  const parts = splitOnQuery(text, q);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.match ? (
          <mark
            key={i}
            className="rounded-[3px] bg-primary/25 px-0.5 text-foreground"
          >
            {part.text}
          </mark>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </span>
  );
}

function splitOnQuery(text: string, query: string): { text: string; match: boolean }[] {
  const out: { text: string; match: boolean }[] = [];
  const hay = text.toLowerCase();
  const needle = query.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const found = hay.indexOf(needle, i);
    if (found === -1) {
      out.push({ text: text.slice(i), match: false });
      break;
    }
    if (found > i) out.push({ text: text.slice(i, found), match: false });
    out.push({ text: text.slice(found, found + needle.length), match: true });
    i = found + needle.length;
  }
  return out;
}
