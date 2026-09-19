import type { MeetingSummary } from "@/types/meeting";

/**
 * Summary templates (PLAN §3, Level 1.5). Like Fathom's "Change template", these are different
 * precomputed *formats* of the same seeded summary content — not live re-summarization (which
 * would need an LLM, a Level 3 bonus). Derived from the summary's tldr / keyPoints / sections so
 * every meeting gets a switcher without hand-authoring each format.
 *
 *   Overview  — the gist as a paragraph plus key points (default).
 *   Detailed  — the gist plus each structured section (offered when sections exist).
 *   Bullets   — a flat, scannable list of every point.
 */

export interface SummaryBlock {
  heading?: string;
  kind: "paragraph" | "bullets";
  text?: string;
  items?: string[];
}

export interface SummaryTemplate {
  id: string;
  name: string;
  blocks: SummaryBlock[];
}

export function buildSummaryTemplates(summary: MeetingSummary): SummaryTemplate[] {
  const keyPoints = summary.keyPoints ?? [];
  const sections = summary.sections ?? [];
  const templates: SummaryTemplate[] = [];

  const overview: SummaryBlock[] = [{ kind: "paragraph", text: summary.tldr }];
  if (keyPoints.length) {
    overview.push({ kind: "bullets", heading: "Key points", items: keyPoints });
  }
  templates.push({ id: "overview", name: "Overview", blocks: overview });

  if (sections.length) {
    const detailed: SummaryBlock[] = [{ kind: "paragraph", text: summary.tldr }];
    for (const s of sections) {
      detailed.push({ kind: "bullets", heading: s.heading, items: s.points });
    }
    templates.push({ id: "detailed", name: "Detailed", blocks: detailed });
  }

  const allPoints = [...keyPoints, ...sections.flatMap((s) => s.points)];
  if (allPoints.length >= 3) {
    templates.push({
      id: "bullets",
      name: "Bullet points",
      blocks: [{ kind: "bullets", items: allPoints }],
    });
  }

  return templates;
}
