# NoteFlow Dashboard Redesign Specification

> **Purpose:** This file is the implementation/design source of truth for rebuilding the authenticated NoteFlow product UI.  
> It is intentionally opinionated: preserve the real product behavior, but replace the current dashboard presentation with a premium, restrained, product-specific interface.

---

## 1. Product Design Goal

NoteFlow must feel like a **premium meeting intelligence product**, not a generic AI/SaaS dashboard.

The authenticated application should visually belong to the same brand as the marketing website, while becoming calmer and more functional once the user enters the product.

The visual language is:

- cinematic black
- graphite surfaces
- off-white typography
- silver/grey secondary text
- extremely subtle glass/translucency
- thin low-contrast borders
- restrained monochrome meeting artwork
- deliberate whitespace
- large editorial typography
- compact functional controls
- minimal use of semantic color

The dashboard must **not** become a collection of colorful metric cards, glowing gradients, generic AI widgets, or decorative glass panels.

### Core principle

**Marketing = expressive. Product = restrained.**

The marketing site may use large particle/wave imagery. Inside the dashboard, use that visual language only as a quiet brand signature — never as the dominant background behind every panel.

---

# 2. Existing Product Behavior That Must Survive

The redesign changes the interface and information architecture, not the underlying product truth.

The authenticated application currently contains these real surfaces:

- My Meetings
- Meeting workspace
- Action items
- Highlights
- Shared meetings

The current app also provides:

- recording/capture
- meeting status
- realtime freshness
- meeting playback
- transcript navigation
- Ask across meetings
- Ask within one meeting
- AI meeting summary
- decisions
- action items
- highlights
- public sharing
- timestamp-linked navigation

Do not invent fake dashboard data just to make the UI visually richer.

### Critical interaction to preserve

All meeting moments use seconds as the shared navigation model.

Transcript click → `seekTo(seconds)` → player seeks and plays.

Ask citation → `seekTo(seconds)` → player seeks and plays.

Playback time → corresponding transcript line becomes active and scrolls into view.

Manual transcript scrolling pauses auto-scroll temporarily.

This synchronized meeting experience is one of NoteFlow's strongest product behaviors and should become **more visible**, not less visible, in the redesign.

---

# 3. Information Architecture

Replace the old top-tab-heavy application shell with a persistent left navigation.

## Primary navigation

```text
NoteFlow

Home
Meetings
Intelligence
People

────────────

Highlights
Action items
Shared

────────────

Settings
```

### Important implementation note

Not every item above currently exists as a dedicated backend surface.

Existing real routes/features should be connected immediately.

New destinations such as **Home**, **Intelligence**, and **People** may initially be composed from existing backend data, but must not display fabricated analytics.

If a data contract does not exist, design an honest empty/coming-state rather than inventing numbers.

### Sidebar bottom

```text
Upgrade to Pro

Saad
saad@noteflow.com
```

The account control stays anchored to the bottom.

The upgrade element should be understated, not a loud advertisement.

---

# 4. Global App Shell

## Desktop

Target shell:

```text
┌───────────────┬──────────────────────────────────────────────────────┐
│               │ Search meetings, people, or ask…     Capture   ●   │
│ NoteFlow      ├──────────────────────────────────────────────────────┤
│               │                                                      │
│ Home          │                    PAGE                              │
│ Meetings      │                                                      │
│ Intelligence  │                                                      │
│ People        │                                                      │
│               │                                                      │
│ Highlights    │                                                      │
│ Action items  │                                                      │
│ Shared        │                                                      │
│               │                                                      │
│ Settings      │                                                      │
│               │                                                      │
│               │                                                      │
│ Upgrade       │                                                      │
│ User          │                                                      │
└───────────────┴──────────────────────────────────────────────────────┘
```

### Sidebar

Width: approximately `232–248px`.

Background:

```css
#050505
```

Use a subtle right divider:

```css
rgba(255,255,255,0.08)
```

Do not place every navigation item inside its own visible rectangle.

Inactive navigation should mostly be text + icon.

Active navigation:

```css
background: rgba(255,255,255,0.065);
border: 1px solid rgba(255,255,255,0.08);
```

Use approximately `10–12px` radius.

### Top utility bar

Keep it visually light.

Contains:

- global search
- `+ Capture`
- optional notifications
- account/avatar where appropriate

Do not add a heavy full-width toolbar background.

The search control should feel integrated into the canvas rather than floating like a giant card.

---

# 5. NoteFlow Design Tokens

Use these as the base system.

```css
:root {
  --nf-bg: #050505;
  --nf-bg-deep: #020202;

  --nf-surface-1: #0B0B0C;
  --nf-surface-2: #101011;
  --nf-surface-3: #171718;
  --nf-surface-hover: #1C1C1E;

  --nf-border: rgba(255,255,255,0.09);
  --nf-border-strong: rgba(255,255,255,0.15);
  --nf-hairline: rgba(255,255,255,0.06);

  --nf-text: #F4F4F2;
  --nf-text-secondary: #A5A5A2;
  --nf-text-muted: #6E6E6B;
  --nf-text-faint: #4D4D4B;

  --nf-primary: #F2F2EF;
  --nf-primary-text: #0A0A0A;

  --nf-live: #D9D9D5;
  --nf-processing: #B9B9B4;
  --nf-ready: #E9E9E5;
  --nf-failed: #D96C64;

  --nf-radius-sm: 8px;
  --nf-radius-md: 12px;
  --nf-radius-lg: 16px;
  --nf-radius-xl: 20px;

  --nf-shadow:
    0 1px 0 rgba(255,255,255,.025) inset,
    0 18px 50px rgba(0,0,0,.24);
}
```

## Semantic color rule

The core interface is monochrome.

Color is allowed only when it communicates state or external identity:

- Google Meet icon
- Zoom icon
- error/destructive state
- very restrained processing/live indicators
- participant avatars

Do **not** give every feature its own purple/green/orange/blue accent.

---

# 6. Typography

Typography should create most of the premium feeling.

Preferred characteristics:

- neutral grotesk / modern sans
- high legibility
- slightly tight display tracking
- normal-to-medium weights
- avoid excessive bold

Example hierarchy:

```css
.page-eyebrow {
  font-size: 12px;
  letter-spacing: .10em;
  text-transform: uppercase;
}

.page-title {
  font-size: clamp(38px, 4vw, 56px);
  line-height: .98;
  letter-spacing: -.04em;
  font-weight: 520;
}

.section-title {
  font-size: 18px;
  font-weight: 540;
  letter-spacing: -.02em;
}

.body {
  font-size: 14px;
  line-height: 1.55;
}

.meta {
  font-size: 12px;
  color: var(--nf-text-muted);
}
```

Avoid giant bold dashboard headings.

The homepage greeting can be expressive, but the application should remain composed.

---

# 7. Home Dashboard

The Home screen is an orientation layer, not an analytics dashboard.

It answers:

1. What is happening next?
2. What did NoteFlow capture recently?
3. What requires my attention?
4. What can I ask NoteFlow?

## Recommended structure

```text
Good afternoon, Saad.

Your meetings are captured.
The useful parts are already waiting.

[ NEXT MEETING / ACTIVE CAPTURE ]

Recent conversations                         Today
────────────────────────────────────────────────────

Weekly product planning                     09:00 Standup
Design review                               10:00 Design sync
Customer feedback call                      14:30 Product sync

────────────────────────────────────────────────────

Action items                                Ask NoteFlow
...
```

### Hero/greeting area

Use generous negative space.

A very subtle monochrome NoteFlow ribbon/particle texture may sit in the upper-right background at approximately `8–15%` opacity.

It must never interfere with text.

Do not put the greeting inside a card.

### Next meeting

This is the dominant functional object.

Use one large horizontal panel.

Content:

- eyebrow: `NEXT MEETING`
- meeting title
- start/end time
- platform
- participant stack
- relative time
- primary action: `Join & capture`
- secondary action: `View details`

Use the strongest contrast for the primary action.

Do not add unnecessary charts or decorative KPIs around it.

---

# 8. Remove the Generic KPI Strip

Do **not** make the homepage lead with four generic cards such as:

- 12 meetings this week
- 48 notes generated
- 28 action items
- 6 people collaborated

This is a common SaaS-dashboard pattern and makes NoteFlow feel templated.

If useful statistics eventually exist, place them deeper in **Intelligence**, where users intentionally seek analysis.

Home should prioritize conversations and work, not vanity metrics.

---

# 9. Recent Conversations

This should be the strongest repeated pattern in the product.

Prefer a refined list over a grid of unrelated cards.

Example:

```text
RECENT CONVERSATIONS

┌────────────────────────────────────────────────────────────┐
│ [wave]  Weekly product planning                     42 min │
│         Today · 9:41 AM · 5 participants                   │
│         Summary ready                                →     │
├────────────────────────────────────────────────────────────┤
│ [wave]  Design review                              28 min  │
│         Yesterday · 3:20 PM · 4 participants               │
│         Processing                                   →     │
├────────────────────────────────────────────────────────────┤
│ [wave]  Customer feedback call                     36 min  │
│         Wed · Sep 24 · 3 participants                       │
│         Ready                                        →     │
└────────────────────────────────────────────────────────────┘
```

### Thumbnail

Use NoteFlow's monochrome abstract ribbon/wave texture.

Each thumbnail may use a different crop.

No rainbow thumbnails.

### Row interaction

Hover:

- surface becomes slightly lighter
- arrow/play affordance becomes visible
- thumbnail contrast rises subtly

Avoid dramatic scaling.

---

# 10. Today / Calendar Rail

A right-side schedule is useful only when calendar data is connected.

Keep it visually quieter than Recent Conversations.

Use a vertical time rail rather than separate cards.

Example:

```text
TODAY

09:00   Standup
        15 min

10:00   Design sync
        Google Meet

14:30 ● Product Sync
        Google Meet

16:00   Customer call
        Zoom
```

The current/upcoming meeting receives the strongest emphasis.

---

# 11. Ask NoteFlow

Ask is a core product behavior, not a decorative AI card.

Global Ask should be accessible from:

- global search / command field
- Home
- Meetings
- Intelligence

Use language such as:

```text
Ask anything you've discussed.

"Which launch risks came up this week?"
"What did we decide about pricing?"
"What does Alex own?"
```

The input should be large enough to feel intentional, but not look like a chatbot pasted into the dashboard.

Responses must preserve meeting citations.

Citation UI should show:

- meeting title
- timestamp
- date where useful

Selecting a citation opens the relevant meeting.

---

# 12. Meetings Screen

Meetings is the user's durable recording library.

Header:

```text
Meetings
Everything NoteFlow has captured.
```

Controls:

- search
- status filter
- date filter
- optional people filter
- Capture

Avoid filter-chip overload.

### Meeting list

Use the same conversation row language as Home, with more metadata.

Possible columns:

```text
Meeting
When
People
Duration
Status
```

But do not make it look like an admin data table.

Use generous row height, thumbnails and human-readable metadata.

### States

Must explicitly design:

- loading
- error
- empty
- live
- processing
- ready
- failed

Do not use fabricated meetings while loading.

---

# 13. Meeting Workspace — Signature Screen

This should become the most distinctive part of NoteFlow.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│ ← Meetings     Product Launch Review              Share      •••   │
│                 Sep 26 · 42 min · 5 people                         │
├─────────────────────────────────────────────────────────────────────┤
│  00:00 ━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━ 42:18    1×         │
├──────────────────────────────────┬──────────────────────────────────┤
│                                  │                                  │
│  MEETING INTELLIGENCE            │  CONVERSATION                    │
│                                  │                                  │
│  Summary                         │  00:14  Saad                     │
│  ...                             │  We decided to...                │
│                                  │                                  │
│  Decisions                       │  00:31  Alex                     │
│  Launch Friday                   │  I'll handle...                  │
│                                  │                                  │
│  Action items                    │                                  │
│  Saad — deploy app               │                                  │
│                                  │                                  │
│  Highlights                      │                                  │
│                                  │                                  │
├──────────────────────────────────┴──────────────────────────────────┤
│ Ask anything about this meeting…                            Ask →   │
└─────────────────────────────────────────────────────────────────────┘
```

## Left intelligence pane

Sections:

- Executive summary
- Key points
- Decisions
- Action items
- Highlights

Do not make each section a separate oversized card.

Use typography, spacing and hairline dividers.

This should read like a beautifully structured document.

## Right conversation pane

Transcript should feel like a conversation, not a log table.

Each segment:

```text
00:14
SAAD

We decided to ship the dashboard on Saturday...
```

Active transcript segment:

- subtle graphite surface
- brighter text
- slim left indicator
- never a bright blue selection block

Clicking it seeks the player.

Playback highlights the corresponding segment.

Manual scrolling preserves the existing temporary auto-scroll pause behavior.

## Player

Use a thin, elegant player spanning the workspace.

Controls:

- play/pause
- current time
- timeline
- total duration
- -10s
- +10s
- playback speed

Avoid a giant media-player card.

## Ask within meeting

Anchor the composer to the bottom of the workspace on large screens.

Citations should seek directly to the referenced moment.

---

# 14. Intelligence Screen

This is where aggregate AI value belongs.

Do not turn it into generic charts.

Potential real-data sections:

```text
Intelligence

Themes across your conversations
Questions that keep returning
Decisions made
Open commitments
People mentioned
```

Use text-first insight modules.

Example:

```text
PRICING

Mentioned in 7 conversations this month.

The team repeatedly discussed:
• annual billing
• UK VAT treatment
• supplier pricing

View conversations →
```

If aggregate endpoints do not exist yet, keep this screen scoped to what can be computed honestly from current meeting data.

---

# 15. People Screen

People should be conversation-centric, not CRM-like.

Example:

```text
People

Alex Morgan
12 conversations
Last met yesterday

Recent topics
Pricing · Launch · Integrations

Open actions
2

View conversations →
```

Do not invent contact details or organizational metadata that NoteFlow does not have.

---

# 16. Action Items

Upgrade this from a static-looking list into a real work surface.

Structure:

```text
Action items

Open                           Completed

○ Finish dashboard UI
  Saad · Weekly product planning · Today

○ Send pricing proposal
  Alex · Customer feedback call · Tomorrow
```

If the backend still cannot persist completion, do not ship a fake interactive checkbox.

Either:

1. implement the completion endpoint first, or
2. render the existing completed state honestly as read-only.

Meeting/timestamp links must remain available.

---

# 17. Highlights

Keep highlights editorial.

```text
Highlights

SEP 26
"We're shipping the dashboard Saturday."

Weekly product planning · 18:42
```

Use large quoted moments, meeting context, and timestamp navigation.

Avoid colorful bookmark cards.

---

# 18. Shared

Shared meetings should emphasize link management.

Each row:

```text
Weekly product planning

Public link created Sep 25

Copy link      Open      Revoke
```

Revoke is destructive and may use the restrained failure color.

Public links remain read-only.

---

# 19. Status System

Preserve the product's four semantic kinds:

```text
LIVE
PROCESSING
READY
FAILED
```

But visually reduce their prominence.

Preferred treatment:

```text
● Recording
◌ Processing
✓ Ready
! Failed
```

Small typography, compact spacing.

Do not make large colored pills the primary visual element of meeting rows.

---

# 20. Cards and Surfaces

The product should not be "cards everywhere."

Use three structural devices:

### 1. Open canvas

For:

- page headings
- greeting
- editorial content

### 2. Bounded functional surfaces

For:

- next meeting
- Ask composer
- schedule
- dialogs

### 3. Divided lists

For:

- meetings
- action items
- highlights
- shared links
- transcript

This creates hierarchy without turning every element into a rounded rectangle.

---

# 21. Brand Texture Usage

The monochrome NoteFlow particle/ribbon artwork is allowed in:

- Home hero background
- meeting thumbnails
- empty states
- onboarding
- login
- subtle workspace backdrop

Do not place a giant wave behind every dashboard section.

Recommended opacity inside authenticated UI:

```text
5% – 15%
```

The content must always win.

---

# 22. Motion

Motion should be almost invisible.

Use:

```css
transition:
  background-color 160ms ease,
  border-color 160ms ease,
  opacity 160ms ease,
  transform 180ms ease;
```

Allowed:

- 1–2px hover lift on primary controls
- gentle opacity reveal
- waveform motion during live recording
- subtle status pulse while recording
- panel/dialog fade

Avoid:

- floating cards
- glowing cursor effects
- looping gradient animations
- exaggerated spring animations
- animated decorative blobs

Respect `prefers-reduced-motion`.

---

# 23. Icons

Use one consistent icon family.

Icons should be:

- outline-first
- approximately 16–18px
- `1.5–1.75px` stroke
- monochrome by default

Do not mix emoji with product icons.

Do not use emoji illustrations in cards.

---

# 24. Buttons

## Primary

```css
background: #F2F2EF;
color: #0A0A0A;
border-radius: 10px;
```

Examples:

- Capture
- Join & capture
- Share link

## Secondary

```css
background: rgba(255,255,255,.035);
border: 1px solid rgba(255,255,255,.11);
color: #EAEAE7;
```

## Ghost

No visible background until hover.

Use for:

- row actions
- overflow menus
- navigation utilities

Do not use pill buttons everywhere.

---

# 25. Responsive Behavior

## Desktop

- persistent sidebar
- max content width approximately `1440px`
- meeting workspace two-column
- schedule/right rail where useful

## Tablet

- collapsible sidebar
- Home right rail moves below primary content
- workspace may retain split view where width permits

## Mobile

- sidebar becomes drawer
- top bar simplified
- cards become edge-to-edge within page padding
- meeting workspace becomes:
  - player
  - Intelligence / Transcript segmented control
  - Ask composer
- no horizontal data tables

---

# 26. Accessibility

Maintain:

- WCAG-friendly contrast
- keyboard-visible focus
- semantic buttons
- minimum practical 40px touch targets
- labels for icon-only controls
- transcript controls usable without pointer
- status meaning not communicated by color alone

Focus style:

```css
outline: 2px solid rgba(255,255,255,.65);
outline-offset: 2px;
```

---

# 27. Loading / Empty / Error Design

These states are part of the premium experience.

## Loading

Use restrained skeletons that preserve final layout.

No fake meeting titles.

## Empty

Use one quiet monochrome NoteFlow visual and useful instruction.

Example:

```text
No meetings yet.

Capture your first Meet, Zoom, or Teams call.
NoteFlow will turn it into a transcript, summary,
actions and searchable conversation.

Capture a meeting
```

## Processing

```text
Transcribing your meeting

The recording is safe.
NoteFlow is preparing the transcript and meeting intelligence.
```

## Failed

Explain clearly that processing failed and what is still safe/available.

Avoid alarming full-screen red states.

---

# 28. What Makes This Feel AI-Generated — Do Not Do It

Avoid all of these:

- dashboard composed entirely of rounded cards
- purple/blue gradients as default AI branding
- glow around every surface
- random colorful icon backgrounds
- emoji feature illustrations
- four KPI cards immediately below the heading
- fake charts with no product reason
- generic "AI Insights" widgets
- oversized pill navigation
- glassmorphism on every panel
- gradients inside every card
- excessive badges
- excessive drop shadows
- decorative dotted grids
- random sparkles
- every section centered
- repeated identical card layouts
- huge corner radii
- overly symmetrical layouts
- placeholder analytics that the backend cannot provide
- marketing copy inside functional workflows

Premium does **not** mean more decoration.

Premium means:

- hierarchy
- restraint
- typography
- spacing
- material consistency
- excellent interaction states
- product-specific information architecture

---

# 29. Implementation Guardrails

The authenticated dashboard is backed by real FastAPI/Supabase data.

Do not redesign against demo/seed content.

Preserve:

- authenticated fetches
- realtime refetch behavior
- existing DTO truth
- share create/copy/revoke behavior
- meeting status mapping
- playback/transcript synchronization
- Ask citations
- loading/error/empty/live/processing states

When introducing new dashboard modules:

1. identify the real endpoint/data source;
2. define loading/error/empty states;
3. do not seed fake production data;
4. keep components reusable;
5. keep visual components separate from data-fetching logic where practical.

---

# 30. Recommended Component Architecture

```text
components/app-shell/
  Sidebar.tsx
  AppTopbar.tsx
  GlobalSearch.tsx
  AccountControl.tsx

components/home/
  HomeHeader.tsx
  NextMeeting.tsx
  RecentConversations.tsx
  TodaySchedule.tsx
  HomeActionItems.tsx
  AskEntry.tsx

components/meetings/
  MeetingList.tsx
  MeetingRow.tsx
  MeetingThumbnail.tsx
  MeetingFilters.tsx
  MeetingStatus.tsx

components/workspace/
  WorkspaceHeader.tsx
  RecordingBar.tsx
  IntelligencePane.tsx
  SummarySection.tsx
  DecisionsSection.tsx
  ActionsSection.tsx
  HighlightsSection.tsx
  TranscriptPane.tsx
  TranscriptSegment.tsx
  MeetingAskComposer.tsx

components/action-items/
components/highlights/
components/shared/
components/intelligence/
components/people/

components/ui/
  Button.tsx
  IconButton.tsx
  Surface.tsx
  Divider.tsx
  Avatar.tsx
  EmptyState.tsx
  Skeleton.tsx
  Dialog.tsx
  Tooltip.tsx
```

Names can adapt to the existing repository, but avoid one enormous dashboard component.

---

# 31. Home Screen Visual Blueprint

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR │ Search meetings, people, or ask…               + Capture      S │
│         │                                                                   │
│ NoteFlow│  THU, SEP 26                                                     │
│         │  Good afternoon,                                                 │
│ Home    │  Saad.                                      [subtle brand art]   │
│ Meetings│                                                                   │
│ Intel.  │  Your conversations are already turning into useful work.        │
│ People  │                                                                   │
│         │  NEXT MEETING                                                     │
│ Highl.  │  ┌─────────────────────────────────────────────────────────────┐  │
│ Actions │  │ Product Sync                           In 28 minutes        │  │
│ Shared  │  │ 2:30–3:00 PM · Google Meet · avatars                     │  │
│         │  │                                  Join & capture  Details   │  │
│ Settings│  └─────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         │  Recent conversations                           Today             │
│         │  ────────────────────────────────               ───────────────   │
│         │  [wave] Weekly product planning  42m            09:00 Standup     │
│         │         Today · 5 people · Ready                10:00 Design sync │
│         │  ────────────────────────────────               14:30 Product ●   │
│         │  [wave] Design review             28m            16:00 Customer   │
│         │  ────────────────────────────────                                  │
│         │                                                                   │
│ Upgrade │  Action items                              Ask NoteFlow            │
│ Saad    │  ○ Finish dashboard UI                    [ Ask anything…      ]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

This blueprint is the target hierarchy, not a requirement to draw visible boxes around every region.

---

# 32. Meeting Workspace Visual Blueprint

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Meetings    Product Launch Review                      Share        •••   │
│               Sep 26 · 42 min · 5 people                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ▶  12:18   ━━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━   42:18   1×         │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ MEETING INTELLIGENCE              │ CONVERSATION                            │
│                                   │                                         │
│ Executive summary                 │ 00:14  SAAD                             │
│ The team agreed to…               │ We decided to ship…                     │
│                                   │                                         │
│ ───────────────────────────────   │ 00:31  ALEX                             │
│ Decisions                         │ I'll handle the release…                 │
│ ✓ Launch Friday                   │                                         │
│                                   │                                         │
│ ───────────────────────────────   │                                         │
│ Actions                           │                                         │
│ ○ Saad · Deploy app               │                                         │
│                                   │                                         │
│ Highlights                        │                                         │
├───────────────────────────────────┴─────────────────────────────────────────┤
│ Ask anything about this meeting…                                      ↑    │
└─────────────────────────────────────────────────────────────────────────────┘
```

This screen should feel closer to a professional editing/research workspace than a SaaS dashboard.

---

# 33. Final Quality Checklist

Before calling the redesign complete, verify:

- [ ] The UI still feels unmistakably NoteFlow without relying on a logo.
- [ ] The dashboard is primarily monochrome.
- [ ] No generic four-KPI-card strip dominates Home.
- [ ] There is generous empty space.
- [ ] Not every section is a card.
- [ ] Typography provides hierarchy before borders/shadows do.
- [ ] Brand artwork is subtle inside the app.
- [ ] Meetings are the central object.
- [ ] The next meeting has an obvious capture action.
- [ ] Recent conversations are easy to scan.
- [ ] Ask NoteFlow feels native to the workflow.
- [ ] Meeting workspace is the strongest screen.
- [ ] Transcript/player synchronization is preserved.
- [ ] Ask citations remain timestamp-aware.
- [ ] Sharing still supports create/copy/revoke.
- [ ] All real loading/error/empty/status states are designed.
- [ ] No fake production analytics are shown.
- [ ] Semantic color is restrained.
- [ ] No emoji illustrations are used.
- [ ] No purple/blue "AI gradient" language appears.
- [ ] Mobile has a deliberate layout rather than a squeezed desktop UI.
- [ ] The final interface looks designed by a product team, not generated from a dashboard prompt.

---

# 34. Design North Star

When choosing between two treatments, choose the one that is:

**quieter, clearer, more editorial, more functional, and more specific to meetings.**

Do not try to prove that NoteFlow is an AI product through visual clichés.

The intelligence should be visible through what the product **does**:

- it remembers conversations;
- it finds decisions;
- it extracts actions;
- it links answers back to exact moments;
- it keeps recording, transcript and intelligence synchronized.

That behavior is the premium experience.

---

## Source-of-truth reminder

The existing authenticated product uses real backend data and currently exposes My Meetings, the meeting workspace, Action items, Highlights and Shared. The redesign may change the shell and presentation freely, but it must preserve the functional behaviors and truthful states documented in the architecture brief.
