---
name: section-clone
description: Clone/adapt a section from any website into the NoteFlow site. Use when the user gives a URL and asks to clone, copy, adapt, recreate, or "design like" a section (hero, features, pricing, how-it-works, testimonials, FAQ, footer, any block) from that site. Opens the site in Chrome, screenshots and inspects the section's real DOM/styles, then rebuilds it in NoteFlow's adopted theme with NoteFlow content — never as a pixel copy, never with the AI-generated look (rules.md is binding).
---

# Section Clone — reference in, NoteFlow out

Take a section from a reference site and rebuild it as a **NoteFlow** section: the reference's
structure, spacing rhythm, and interaction quality; NoteFlow's theme, type, and true product
content. The result must read as designed by an experienced product designer for this product —
not generated, not a template, not a skin of the reference.

**Binding rulebook:** read [rules.md](rules.md) in this folder BEFORE writing any code, and run
its Required Self-Review before showing the result. Every rule in it is a hard constraint from
the product owner. If the reference section itself violates those rules (fake logos, stat
circles, icon-card grids, gradient soup), adapt the *idea* and drop the violation.

## Inputs

- A URL (required). A section name/description (hero, pricing, "the part with the timeline"…).
  If the user gave a URL but no section, ask once which section they mean — nothing else.

## Workflow

### 1. Capture the reference (evidence, not memory)

1. Load browser tools via ToolSearch in ONE call:
   `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__browser_batch`
2. `tabs_context_mcp` (createIfEmpty) → navigate to the URL → wait 3–4s → screenshot.
3. Scroll until the target section is fully in view; screenshot it (use `zoom` on details worth
   studying: buttons, list rows, type pairings). These screenshots are the visual ground truth.
4. Inspect the real implementation with `javascript_tool` — find the section's root element
   (by heading text or landmark), then extract a compact structural report, e.g.:

```js
// Adjust the selector/heading text to the target section.
const root = [...document.querySelectorAll("section,div")]
  .find(el => el.innerText?.includes("HEADING FRAGMENT") && el.offsetHeight > 200);
const pick = el => {
  const cs = getComputedStyle(el);
  return { tag: el.tagName, cls: el.className?.toString().slice(0,80),
    font: `${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight} ${cs.fontFamily.split(",")[0]}`,
    color: cs.color, bg: cs.backgroundColor, pad: cs.padding, gap: cs.gap,
    display: `${cs.display} ${cs.gridTemplateColumns !== "none" ? cs.gridTemplateColumns : ""}`,
    radius: cs.borderRadius, border: cs.border };
};
JSON.stringify({
  section: pick(root),
  children: [...root.children].slice(0,12).map(pick),
  headings: [...root.querySelectorAll("h1,h2,h3")].slice(0,6).map(h => ({ t: h.innerText.slice(0,80), ...pick(h) })),
  outer: root.outerHTML.length > 6000 ? root.outerHTML.slice(0,6000) + "…" : root.outerHTML,
}, null, 1);
```

   From this, write down (for yourself): the layout skeleton (columns, alignment, widths), the
   spacing rhythm, the type scale steps actually used, what carries hierarchy (size? weight?
   color? position?), and any motion. That analysis — not the HTML — is what you port.

### 2. Translate to NoteFlow (the theme is already decided)

Never ship the reference's colors, fonts, logos, imagery, or copy. Map onto the adopted system:

- **Tokens:** `DESIGN.md` + `tailwind.config.ts` are canonical — `background #000`, `surface
  #0E0E10`, `foreground #FAF5F5`, `muted`, `border #2A2A2A` (1px hairlines). Brand hues
  (cyan/purple/pink/orange/yellow) exist but appear **only as small, purposeful marks** — the
  user's rulebook bans gradient/glow decoration, and it wins over older gradient habits.
- **The adopted hero direction** (Vesper world, already shipped): black canvas, restrained
  monochrome-metallic buttons (`.vsp-btn-solid`, `.vsp-btn-ghost`, `.vsp-navlink` in
  `globals.css`), film grain *in the hero only*, Sora for everything with the Instrument Serif
  *italic* accent used at most once per screen. New sections must sit under that hero without
  fighting it: mostly monochrome, hairline borders, generous whitespace, quiet motion.
- **Type:** Sora, few sizes, weight ≤ 600 for headings unless justified; the existing fluid
  scale (`text-h2`, `text-p-medium`, …) before inventing new sizes.
- **Geometry:** buttons 6–10px radius, panels 10–18px; no pill-everything, no `rounded-3xl`
  bubbles.

### 3. Content must be true NoteFlow

Write copy from what the product actually does — nothing invented:

- Joins Google Meet, Zoom, and Microsoft Teams calls with a notetaker bot (paste a link, or
  one click from the Chrome extension).
- Live status: joining → recording → ready. Transcript with speakers and timestamps, synced to
  the recording.
- AI summary, action items, and key moments for every meeting.
- Ask NoteFlow answers questions across your meetings and cites the exact moment.
- Share a meeting recap with a public link. Google sign-in. Free plan records unlimited meetings.

Those are the ONLY claims available. No user counts, no company logos, no ratings, no
integrations beyond Meet/Zoom/Teams + the extension, no testimonials presented as real.

### 4. Build

- Implement as a component in `src/components/landing/` wired into `src/app/product/page.tsx`
  (or the page the user names), replacing the section the user wants replaced — touch nothing
  else. Reuse existing utilities (`.vsp-*`, marquee, tokens) before adding CSS; anything new
  goes in `globals.css`, scoped and commented.
- Respect `prefers-reduced-motion`; keyboard focus visible; real states (the section must not
  depend on fabricated data to look complete).

### 5. Verify, self-review, ship

1. `rm -rf .next && npx next build` (this repo's server/build race: always clean-build), start
   on **:3100** (3000 is a different app), screenshot the section desktop-width; fix what the
   screenshot shows; re-check once. Confirm it sits well between its neighbor sections.
2. Run the **Required Self-Review** at the end of rules.md line by line; fix violations before
   presenting. The kill question: *"Could this belong to any SaaS site?"* If yes, redesign.
3. Show the user the screenshot + what was taken from the reference vs. what was changed and
   why. Commit/push only if the user's workflow expects it (they test on the live Vercel URL).
