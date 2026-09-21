# NoteFlow — DESIGN.md

The design system for NoteFlow, derived from the Fathom.ai visual world the user chose to clone.
This is the **canonical visual authority**: every new surface (product/marketing pages **and** the
authenticated dashboard) builds from these tokens and patterns rather than raw hex or ad-hoc values.

> Mode note: the **product/marketing** pages are *Persuade* (design is the product — expressive,
> cinematic). The **app dashboard** is *Operate* (scanability and calm outrank expression); it
> inherits the same palette/type but uses the loud gradient/star motifs sparingly, as accents only.

---

## 1. Foundations

### 1.1 Color — brand palette (from Fathom)
Canvas is near-black; text is warm off-white; the identity lives in a 4-hue accent set that only
ever appears as **gradients, glows, and small marks** — never as large flat fills of body UI.

| Token (Tailwind) | Hex | Role |
|---|---|---|
| `background` | `#000000` | Page canvas (marketing). App may use `#0A0A0B` for slightly softer panels. |
| `surface` | `#0E0E10` | Raised panels / glass base |
| `surface-hover` | `#17171A` | Hover on surfaces |
| `offblack` | `#191919` | Footer / secondary sections |
| `border` | `#2A2A2A` | Hairline dividers (1px only) |
| `foreground` | `#FAF5F5` | Primary text (warm off-white) — the global default text color |
| `muted` | `rgba(250,245,245,0.66)` | Secondary text (tint from foreground, never pure gray) |
| `brand-cyan` | `#00BEFF` | **Link primary**, info accent |
| `brand-purple` | `#9600FF` | Gradient stop / accent |
| `brand-pink` | `#FFA8BB` | Gradient stop / accent |
| `brand-orange` | `#F55200` | Gradient stop / accent |
| `brand-yellow` | `#FFF58C` | Gradient stop / accent, primary CTA fill on dark |
| `danger` | `#F8E4E4` bg / `#F55200`-adjacent | Errors (reuse orange family) |

**Signature gradient** (the single most identifying mark — use for the button sweep, hero grid,
gradient card borders, and clipped headline spans):
```
linear-gradient(90deg, #FFA8BB 0%, #F55200 34%, #9600FF 67%, #FFF58C 100%)
```
Two-stop variants seen in the reference (use for smaller accents / card borders):
`pink→orange`, `orange→yellow`, `yellow→purple`, `purple→pink`, `cyan→#007299`.

Contrast rule: body/placeholder ≥ 4.5:1, large text ≥ 3:1. On a colored surface, tint secondary
text from that hue or from `foreground` — never flat gray.

### 1.2 Typography
- **Family:** `Sora` (self-hosted via `next/font/google`), fallback `Arial, sans-serif`. One family
  for everything — display and body. Replace Inter/Space Grotesk.
- **Line-height:** 120% for headings/UI; ~150% for long-form paragraphs.
- **Weight:** headings frequently use `font-weight: 400` (regular) with a `font-weight: 600` span
  for the emphasized clause — Fathom's "two-weight headline" idiom. `strong` = 500, never 700+.
- **Fluid scale** (clamp, min at 20rem viewport → max at 120rem), expose as Tailwind `fontSize`:

| Token | min → max |
|---|---|
| `h1` | 3.5rem → 5.5rem |
| `h2` | 2.5rem → 4rem |
| `h3` | 2rem → 3rem |
| `h4` | 1.25rem → 1.75rem |
| `h5` | 1.5rem |
| `p-large` | 1.25rem → 2rem |
| `p-medium` | 1rem → 1.5rem |
| `p-regular` | 1rem → 1.125rem |
| `p-small` | 0.725rem → 1rem |
| `p-tiny` | 0.85rem → 0.875rem |

- Tracking floor `-0.04em` on large display; headings balanced (`text-wrap: balance`).
- **Clipped-gradient headline spans**: apply the signature/2-stop gradient to a `<span>` via
  `background-clip: text; color: transparent`. This is the ONE sanctioned use of gradient text in
  this world (it's a pinned brand idiom), reserved for one emphasized clause per section — not body.

### 1.3 Spacing, radius, layout
- Container: `container-large` ≈ `max-width: 80rem` (1280px) centered; global horizontal padding
  `clamp(1rem, 5vw, 2rem)` (`padding-global`). Reading measure caps at ~48rem.
- Section vertical rhythm: `clamp(3.5rem, 8vw, 7rem)` top/bottom; more space above a heading than
  below it.
- Radius: **pill** (`9999px`) for buttons and nav chips; **`1.5rem`** for boxed cards/panels
  (`data-boxed`); `0.75rem` for small controls. Boxed inner padding `clamp(1.5rem, 4vw, 3.5rem)`.
- Grid: responsive `repeat(auto-fit, minmax(320–360px, 1fr))`, gap `1.5rem`.

### 1.4 Depth & surfaces
- **Shadows** carry offset + soft blur (never a zero-offset colored halo as "depth"):
  e.g. `0 18px 44px -14px rgba(0,0,0,0.6)`. Glows are a *separate* decorative layer, not the shadow.
- **Glassmorphism panel**: `background: rgba(255,255,255,0.04)` + `backdrop-filter: blur(12–20px)`
  with a **gradient 1px border** via the mask-composite technique:
  ```css
  position: relative;
  /* ::before */ inset:0; border:1px solid transparent; border-radius:inherit;
  background: linear-gradient(354deg,#000 3%,#ffffff3d 51%,#000 97%) border-box;
  mask: linear-gradient(#000 0 0) border-box, linear-gradient(#000 0 0) padding-box;
  mask-composite: subtract;
  ```
  Colored card borders swap the `::before` background for a 2-stop brand gradient.

---

## 2. Components

### 2.1 Buttons
- **Primary `.button.grad`** — pill, solid dark base, with an animated **gradient sweep** overlay
  (`.button-gradient`) that translates across on hover (Fathom signature). Variants recolor the
  sweep: `base` (full signature), `yellow`, `pink`, `purple`. Label often UPPERCASE for CTAs
  ("SIGN UP FREE", "GET STARTED. IT'S FREE."). Text is high-contrast (`foreground`/black on yellow).
- **Secondary** — pill, `border: 1px solid border`, transparent fill, `hover:bg-surface-hover`.
- **Text/underline link** — `foreground` with `underline underline-offset-[6px]` and
  `decoration-muted` → `decoration-brand-cyan` on hover. Links default to `brand-cyan`.
- Focus-visible ring: `0.125rem solid #4D65FF` (Fathom's focus blue) with `2px` offset, on every
  interactive element.

### 2.2 Navigation
- Fixed top nav. Brand wordmark left. Center menu sits inside a **glass pill** (`glass_wrapper`):
  blurred, gradient-1px-bordered rounded-full container holding the links. Right side: text links
  ("Log In") + a primary `.button.grad`. Mobile: hamburger that morphs to X.
- App tab row (dashboard) uses the same type/ío but as a simple underline-active bar (calm Operate
  variant) — active tab underlined with a brand accent, inactive `muted → foreground` on hover.

### 2.3 Cards / panels
- Boxed radius `1.5rem`, glass base, gradient or hairline border. Never stack a card inside a card.
- The "eyebrow" pattern: a small **4-point star** sparkle glyph + `p-tiny` uppercase-ish label above
  a heading — but per craft floor, a plain kicker/eyebrow line is banned; the star+label counts as a
  *marked* sub-element (a drawn icon carrying meaning), used sparingly, not on every section.

### 2.4 Inputs
- Dark field: `surface` bg, `border` hairline, `foreground` text, `muted` placeholder, pill or
  `0.75rem` radius. Focus ring as above. Ask/search inputs use a rounded container with a trailing
  gradient send button.

### 2.5 Iconography
- Drawn SVG in one consistent stroke weight (~1.75), from a real set or authored. No emoji/Unicode
  glyphs standing in for icons. The **4-point sparkle star** is the house mark.

### 2.6 Star eyebrow (`sub-element`)
The recurring section-opener, NOT a bare kicker. A drawn **4-point sparkle star** + a `p-tiny`
label, tinted by a variant hue (`blue` / `yellow` / `pink` / `black`). The label uses the
scroll **scramble** reveal. One per section, above the heading. Example labels from the reference
map to NoteFlow copy — e.g. `Unforgettable meetings…quite literally`, `Works wherever you do`,
`Zero friction, maximum flexibility.` Never ship a plain "Features" / "Why us" kicker without the
star mark (see anti-references).

### 2.7 Announcement banner
Full-width dismissable rail above the nav. Small logo mark + short SHOUTED phrase + inline
`LEARN MORE →` link. Supports gradient backgrounds (`pink→purple`, `orange→yellow`, etc.) or a
flat brand hue with black text; can run as static, slider, or marquee. Session-dismissable (an X);
stays closed for the session. Use for one genuine announcement only — never as decoration.

### 2.8 Nav dropdowns (mega-menu)
Beyond the glass pill: menu items with children open a **hover/focus dropdown** (`Solutions`,
`Integrations`, `Resources` in the reference). Each dropdown is a bordered dark panel of
`nav_menu_link dr` rows. A chevron rotates on open. On scroll, the nav can **swap** the top CTA to
its animated (`is-animated`) sweep variant (`data-btn-swap`). Mobile collapses all of it behind the
hamburger→X.

### 2.9 Home slider (caption-over-image)
A centered `swiper` carousel: each slide is a short caption (`p-medium`, one clause gradient-clipped
if emphasized) **above** a screenshot/product image. Yellow pagination bullets + circular prev/next
arrows (disabled state greyed). `slidesPerView:auto`, centered, peek of the next slide on the right.
A parallax gradient wash drifts behind it on scroll. Use for "show the product in N beats."

### 2.10 Sticky-tab feature switcher (Clarity / Momentum / Ease)
Desktop: a **scroll-pinned** two-column block. Left = a vertical accordion of 3 feature entries
(each: star eyebrow + scramble label, `text-component` paragraph, a `.grad` button in that entry's
hue). Right = a single image frame that **cross-fades** to the active entry's shot, backed by a
colored gradient glow (`gradient_pink-purple` etc.). Scroll position drives which entry is open;
clicking an entry scroll-jumps to it. Mobile: the same entries as stacked static cards, each with
its own image on top. This is the primary "3 pillars of the product" pattern — use it, don't invent a
generic 3-up icon grid.

### 2.11 Stat circles (scroll-assembled)
Three (or N) big **circular** stats, each a ring in a distinct hue (orange / pink / cyan) holding a
`text-stat` number + a `p-tiny` caption, trailed by a vertical "trail" line. On desktop they rise
into place on a **pinned scroll timeline** (staggered, overlapping) over the interactive
gradient-grid canvas; mobile falls back to a static stacked column. Numbers are real product metrics,
never invented — if we don't have the metric, we don't show the circle.

### 2.12 Sticky scroll headline (clause-swap)
A `sticky-title-wrapper` where 2–3 large `h3` statements are pinned and revealed **char-by-char**,
each swapping to the next as you scroll (`SplitText` + `ScrollTrigger`, scrubbed). One emphasized
clause per statement is gradient-clipped (`gradient_pink-yellow`, `gradient_pink-purple`,
`gradient_orange-pink`). Use for a narrative "here's how it works" beat, with a single absolute
`.grad` CTA pinned at the end. Reduced-motion → all statements simply visible, stacked.

### 2.13 Integrations constellation
A center brand mark with **integration bubbles** (icon + name) arranged left/right, each connected
to the center by a thin pinned line that grows in on scroll (randomized stagger). Behind it: the
signature-gradient perspective grid with a radial vignette. Bookended by a star eyebrow + `h3`
("Works where you meet") and a closing centered `h3`. Bubbles show only integrations we actually
support.

### 2.14 Use-case carousel (draggable)
A `slick`/drag carousel of use-case cards (`variableWidth`, free-drag, cards scale down while
dragging). Each card = image + title (`text-size-large`) + pink star scramble sub-label + description
+ a **purple** `.grad` button ("SEE … FOR SALES"). Use to enumerate audiences/roles without a wall
of text. Real roles only.

### 2.15 Gradient CTA band
Full-bleed closing section on a `pink→purple` gradient (with an astronaut/'3D object image), a
**black**-variant star eyebrow, a two-weight `h3` ("Stop guessing. Ask NoteFlow. / Start today, for
free."), and a **yellow** `.grad` button. This is the page's final ask — exactly one per page.

### 2.16 Mega footer
`offblack` background. Brand mark, then a multi-column link grid (Product / Company / Solutions /
Integrations / Comparisons / Resources) + a `.grad` "TRY NOTEFLOW TODAY" button, then a bottom rule
row (Terms · Privacy · Security · Status) and copyright with a **dynamic year**. Only link to routes
that exist.

---

## 3. Motion & motifs (the Fathom "world")
Use these as the committed visual world. On the **Operate** dashboard, keep them subtle (a single
accent), never full-screen animation.

- **Starfield**: layered canvas of static stars (all devices) + slow drift & pointer-parallax on
  desktop only. Twinkle a small subset (opacity only).
- **Astronaut / planetary imagery**: hero art gently bobs (`sine.inOut`, ~3s yoyo). Optional planet
  scroll-scrub video on desktop.
- **Gradient grid**: faint perspective grid with the signature-gradient stroke + radial vignette,
  behind stat/section blocks.
- **Marquee**: single slow continuous horizontal drift for a phrase strip ("Move work forward
  faster"), pause on hover, reduced-motion aware.
- **Text reveals**: hero typewriter (char stagger) and scroll "scramble" on eyebrow labels; sticky
  scroll-pinned headlines that swap clauses. One authored moment per section — not every element.
- **Button sweep**: the gradient overlay slide described in 2.1.
- **Reduced motion**: every loop/scrub degrades to a static first frame; honor
  `prefers-reduced-motion`.

Motion easing: exponential ease-out from an already-visible default (`cubic-bezier(0.16,1,0.3,1)`),
so content is never stranded at low opacity if animation is throttled.

---

## 4. Implementation notes (this codebase)
- **Tokens** live in `tailwind.config.ts` (`theme.extend.colors`, `fontSize`, `fontFamily`,
  `borderRadius`) + `src/app/globals.css` for the world utilities (`.stars`, `.nebula`→retune to
  brand glows, `.button-gradient` sweep, gradient-border `[data-border]`, clipped-gradient spans,
  marquee keyframes). Build components from token names, not raw hex.
- **Font**: swap `next/font` Inter/Space_Grotesk → `Sora` in `src/app/layout.tsx`, expose as
  `--font-sora`; set `font-sans` (and `font-display`) to Sora.
- **Surfaces to restyle** to this system: `/product` (Persuade — full world) and the app
  (`/app/*`: `AppHeader`, `AppTabs`, `MeetingsList`/cards, meeting workspace, Highlights / Action
  items / Shared, `AskSidebar`, states/skeletons) as the calmer Operate variant.
- Preserve all product truth, real data, copy, functionality, routes, and the NO-hardcoded-data
  rule. This is a reskin of the visual layer, not a content/behavior change.
- Keep the seeded `v1-seeded-submission` era untouched.

## 5. Product page anatomy (`/product` — Persuade, full world)
The reference is a **long cinematic scroll** of distinct, fully-realized sections — not three
padded feature cards. Build the NoteFlow product page in this order; each section is a real, filled
component from §2, not a placeholder. Copy is NoteFlow's own (meeting notetaker), structure is the
reference's.

| # | Section | Component | NoteFlow content |
|---|---|---|---|
| 0 | Announcement rail *(optional)* | §2.7 | Only if there's a real announcement; else omit. |
| 1 | **Nav** | §2.2 + §2.8 | Glass pill: Features · Ask NoteFlow · For teams · Pricing · FAQ. Right: Log in + `SIGN UP FREE`. |
| 2 | **Hero** | starfield + astronaut | Two-weight typewriter h1 ("**Focus on the conversation.** NoteFlow *keeps the record.*") + subcopy + `.grad` CTA + a real compliance/trust row. Astronaut art bobs. Below: a trust strip (rating badge + "used by …" logo row) in glass cards. |
| 3 | **Product beats slider** | §2.9 | 3–4 captioned screenshots: record bot-free → instant AI summary → Ask across meetings → timestamped playback. |
| 4 | **Marquee** | §3 marquee | One phrase, gradient-clipped keyword ("Turn **talk** into action"). |
| 5 | **Audience tabs** | §2.10-style tabs | "Whether it's 1 call or 1,000" — teams vs. individuals, each a 2-col (copy + 2×2 value icons). |
| 6 | **3 pillars** | §2.10 sticky-tab switcher | NoteFlow's Clarity / Momentum / Ease equivalents (e.g. Accurate transcripts · Ask NoteFlow · Works with your tools), each with its product screenshot. |
| 7 | **Stats** | §2.11 stat circles | Real metrics only (see [[real-meetings-transcripts]] discipline — no invented numbers). |
| 8 | **How it works** | §2.12 sticky headline | 3 clause-swap statements on the capture→summarize→sync narrative + one CTA. |
| 9 | **Integrations** | §2.13 constellation | Only integrations NoteFlow really has (Recall/Groq-backed capture, calendar, etc.). |
| 10 | **Use cases** | §2.14 carousel | Sales / CS / Marketing / Ops / etc. — only if we can speak to each honestly. |
| 11 | **Final CTA** | §2.15 gradient band | "Stop guessing. Ask NoteFlow." → `SIGN UP FREE`. |
| 12 | **Footer** | §2.16 mega footer | Real routes only; dynamic year. |

Rules: every section carries its own star eyebrow (§2.6) **or** is deliberately eyebrow-less — no
two identical layouts back-to-back; alternate image-left/image-right and full-bleed/contained so the
scroll has rhythm. A section with nothing true to say is **cut**, not padded.

## 6. Dashboard anatomy (`/app/*` — Operate, calm variant)
Same palette, type, and details; the loud motifs (starfield drift, marquee, scroll-scrub, char
reveals) are **off** here — brand shows only in precise details (gradient CTA, star mark on empty
states, gradient-border on the focused card). Scanability and real usage win.

- **App header:** brand mark + the underline-active tab bar (§2.2 app variant): Meetings · Action
  items · Highlights · Shared. Right: account. No glass pill, no dropdown theatrics.
- **Meetings list / cards:** boxed `1.5rem` glass cards, hairline border (gradient border only on
  hover/active), title + participants + date + status chip. Real data, honest processing/empty states.
- **Meeting workspace:** recording player + synced transcript (active line marked by the `.eq-bar`
  equalizer, not a loud glow) + insights/summary + Ask panel. This is the product's core Operate
  screen — density and legibility over expression.
- **Ask panel:** dark field (§2.4) with trailing gradient send; answers cite real transcript segments
  as chips that seek playback. No fabrication; honest "couldn't find that" state.
- **Empty / loading / error states:** star mark + one honest line + one action. Skeletons in
  `surface`, never spinners-as-content. Truthful states are part of the design, not an afterthought.

## 7. Implementation checklist (per surface)
Before calling a surface done: (a) matches its §5/§6 blueprint section-for-section; (b) tokens only,
no raw hex; (c) desktop **and** mobile captured in one batched screenshot round; (d) reduced-motion
verified; (e) all data real, all states truthful, all links resolve; (f) design detector clean
except the one sanctioned gradient-text ignore.

## 8. Anti-references (do not reintroduce)
- The prior indigo `#6C5CE7` / teal `#00D9C0` palette and Inter/Space Grotesk type — replaced.
- Gradient text anywhere except the sanctioned clipped-headline span.
- Flat gray secondary text on colored surfaces; zero-blur "halo" shadows; nested cards; emoji icons;
  a bare eyebrow/kicker line without the star mark.
- **The generic-AI-landing-page smell**, specifically banned: a hero + exactly three equal feature
  cards + a pricing table + footer; identical padded sections stacked with no rhythm; "Powerful
  features / Why choose us / Get started today" filler headings; centered-everything with no
  image-left/right alternation; a lone emoji or line-icon atop each card; invented stats or logos;
  stock "AI gradient blob" with no starfield/astronaut world. NoteFlow follows the specific section
  anatomy in §5–§6 instead.
