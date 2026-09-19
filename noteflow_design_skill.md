---
name: noteflow-design-system
description: Apply NoteFlow's visual design system (colors, typography, spacing, component patterns) whenever building or editing any frontend page, component, or UI element for the NoteFlow project — the AI meeting notetaker clone. Trigger this for landing pages, dashboards, meeting detail views, login screens, buttons, cards, or any visual element in the NoteFlow app, even if the user just says "build the dashboard" or "make a login page" without mentioning design or styling explicitly.
---

# NoteFlow Design System

NoteFlow is an AI meeting notetaker (in the same product category as Fathom/Fireflies). This skill defines its original visual identity — a dark, premium, focused aesthetic suited to a productivity tool people use daily. Apply this system consistently across every page so the app feels like one coherent product rather than a set of mismatched screens.

## Why this matters
A meeting assistant lives in the background of someone's workday — it needs to feel calm, trustworthy, and unobtrusive rather than loud or playful. The dark theme reduces eye strain for people who have it open during back-to-back calls, and the indigo accent gives it a "smart tool" feel without being cold or clinical.

## Colors

Use these as Tailwind CSS variables or a `tailwind.config` theme extension — don't hardcode hex values inline across components.

| Token | Hex | Use for |
|---|---|---|
| `background` | `#0F0F1A` | Page background (near-black navy, not pure black) |
| `surface` | `#1A1A2E` | Cards, panels, sidebar, modals |
| `surface-hover` | `#24243D` | Hover state on cards/rows |
| `border` | `#2D2D45` | Dividers, card outlines |
| `primary` | `#6C5CE7` | Primary buttons, active nav item, links, focus rings |
| `primary-hover` | `#5B4BD6` | Hover state for primary elements |
| `accent` | `#00D9C0` | Success states, "completed" badges, highlights |
| `text-primary` | `#F5F5F7` | Headings, body text |
| `text-muted` | `#9B9BAE` | Timestamps, secondary labels, placeholder text |
| `danger` | `#FF6B6B` | Delete actions, error states |

## Typography

- **Font family:** Inter (or Geist as an alternative) — load via `next/font/google` for performance, don't use a CDN link.
- **Scale:**
  - Page titles: `text-3xl font-semibold` 
  - Section headers: `text-xl font-semibold`
  - Body text: `text-base font-normal`
  - Muted/meta text (timestamps, speaker labels): `text-sm text-muted`
- Keep line-height generous (`leading-relaxed`) for transcript text specifically — it's read carefully, not skimmed.

## Spacing & layout

- Base spacing unit: 4px (Tailwind default scale) — don't invent custom spacing values.
- Page padding: `px-6 py-8` minimum on desktop, `px-4 py-6` on mobile.
- Cards: `rounded-xl` corners (not sharp, not pill-shaped), `p-5` internal padding, `border border-border`.
- Sidebar width: `w-64` fixed, collapsible on mobile.
- Max content width for reading-focused pages (transcript view): `max-w-3xl` centered — long lines of transcript text are hard to read at full width.

## Component patterns

**Buttons**
- Primary: `bg-primary text-white hover:bg-primary-hover rounded-lg px-4 py-2 font-medium`
- Secondary: `bg-surface border border-border text-text-primary hover:bg-surface-hover`
- Always include a `transition-colors` for hover states — abrupt color changes feel cheap.

**Cards (meeting list items)**
- Show: meeting title, date/time (muted), duration, a small speaker-count badge, and a one-line AI summary preview truncated with `line-clamp-2`.
- On hover: subtle `surface-hover` background shift, no scale/shadow tricks — keep it calm.

**Speaker-labeled transcript lines**
- Format: bold speaker label in `primary` color, followed by their text in `text-primary`, timestamp in `text-muted text-sm` aligned right or below.
- Alternate very subtle background tint (`surface` vs `background`) per speaker turn if it helps scanability — optional, only if the transcript is dense.

**Empty states**
- Use a simple centered icon + one-line message + a primary CTA button (e.g., "No meetings yet — upload your first recording"). Avoid illustration-heavy empty states; keep it minimal and functional.

## What to avoid

- Don't use pure black (`#000000`) or pure white — always use the tokens above for softer contrast.
- Don't introduce new accent colors per page — every "call to action" color should be `primary`, every "success" color should be `accent`.
- Don't use drop shadows heavily — this system relies on subtle border/surface contrast, not shadow depth, to separate elements (fits the flat, modern SaaS look).
- Don't reproduce any other product's logo, wordmark, or illustration style — NoteFlow's identity is original even though its tone is inspired by the broader category of meeting-assistant tools.
