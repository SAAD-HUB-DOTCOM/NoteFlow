import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { AppPreview } from "@/components/landing/AppPreview";
import { Starfield } from "@/components/landing/Starfield";
import { HeroVideo } from "@/components/landing/HeroVideo";
import { TeamsTabs } from "@/components/landing/TeamsTabs";
import { LockIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "NoteFlow — AI notes for every meeting",
  description:
    "NoteFlow records, transcribes, and summarizes your calls, then hands you the recap, action items, and answers before you've closed the tab. Now recording bot-free.",
};

export default function ProductPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <LandingNav />
      <main>
        <Hero />
        <CaptureShowcase />
        <BigStatement />
        <TeamsSection />
        <ValueWords />
        <Stats />
        <Integrations />
        <Testimonial />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------------------------------------------------------------- Hero ---- */

function Hero() {
  return (
    <section className="relative -mt-16 flex min-h-[100dvh] flex-col justify-center overflow-hidden pt-16">
      <Starfield />
      {/* cinematic cosmic loop over the starfield; falls back to the still starfield when the
          visitor prefers reduced motion. Sits behind the transparent nav so the two merge. */}
      <HeroVideo />
      {/* two nebula glows anchor the composition — the only large light on the page */}
      <div
        aria-hidden="true"
        className="nebula pointer-events-none absolute -left-40 top-10 h-[34rem] w-[34rem] opacity-70"
        style={{ ["--nebula-color" as string]: "rgba(108,92,231,0.4)" }}
      />
      <div
        aria-hidden="true"
        className="nebula pointer-events-none absolute -right-32 top-40 h-[30rem] w-[30rem] opacity-60"
        style={{ ["--nebula-color" as string]: "rgba(0,217,192,0.18)" }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.12fr] lg:items-center lg:gap-12">
        {/* content on the left, the layered card cluster balanced to its right */}
        <div className="animate-rise-in">
          <h1 className="font-display text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.045em] text-foreground sm:text-[4.2rem]">
            Focus on the conversation.
            <span className="block">NoteFlow keeps the record.</span>
          </h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-muted">
            Record any call and get a clean recap the moment you hang up — then ask it anything,
            weeks later. No bot in the meeting unless you want one.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href="/login"
              className="rounded-full bg-primary px-8 py-4 font-display text-[0.95rem] font-semibold text-white shadow-lg shadow-primary/30 transition-colors hover:bg-primary-hover"
            >
              Get started — free forever
            </Link>
            <Link
              href="/meeting/noteflow-product-planning"
              className="font-display text-sm font-medium text-foreground underline decoration-muted/60 underline-offset-[6px] transition-colors hover:decoration-primary"
            >
              or watch a real meeting recap
            </Link>
          </div>
          <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-2 text-foreground/70">
              <LockIcon className="h-3.5 w-3.5" />
              Enterprise-grade security
            </span>
            {["SOC 2 Type II", "GDPR", "HIPAA", "SSO / SCIM"].map((b) => (
              <span key={b} className="border-l border-border pl-4 first-of-type:border-l-0 first-of-type:pl-0">
                {b}
              </span>
            ))}
          </p>
        </div>

        {/* the card cluster shows on desktop, where there's height for it; on phones/tablets the
            hero stays a single clean screen of headline + CTA */}
        <div className="hidden animate-rise-in [animation-delay:120ms] lg:block">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------- Capture showcase ------ */

function CaptureShowcase() {
  return (
    <section id="features" className="relative scroll-mt-24 overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-foreground sm:text-5xl">
          Capture notes your way — bot or bot-free — and stay in the meeting
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-center text-base leading-relaxed text-muted">
          NoteFlow can join as a visible participant or record quietly in the background. Either
          way, the summary and transcript are ready the second you hang up.
        </p>
        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="nebula pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[44rem] -translate-x-1/2 opacity-50"
            style={{ ["--nebula-color" as string]: "rgba(139,124,246,0.35)" }}
          />
          <div className="relative mx-auto max-w-4xl">
            <AppPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------- Big statement --------- */

function BigStatement() {
  return (
    <section className="relative overflow-hidden border-y border-border/60">
      <Starfield />
      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
        <h2 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-6xl">
          Whether you run a team of 1 or 1,000, NoteFlow remembers every meeting
        </h2>
      </div>
    </section>
  );
}

/* ------------------------------------------------- Teams / individuals --- */

function TeamsSection() {
  return (
    <section id="teams" className="relative scroll-mt-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <TeamsTabs />
      </div>
    </section>
  );
}

/* ------------------------------------------------- Value words ----------- */

function ValueWords() {
  const values = [
    { word: "Clarity", line: "Shockingly accurate transcripts and summaries, at a consistent quality on every single call." },
    { word: "Momentum", line: "Decisions and follow-ups leave the call already assigned — so work moves before the next meeting starts." },
    { word: "Recall", line: "Ask any meeting a question months later and get the answer, with the exact moment it was said." },
  ];
  return (
    <section id="ask" className="relative scroll-mt-24 overflow-hidden border-t border-border/60">
      <div
        aria-hidden="true"
        className="nebula pointer-events-none absolute right-0 top-1/2 h-[32rem] w-[32rem] -translate-y-1/2 opacity-50"
        style={{ ["--nebula-color" as string]: "rgba(108,92,231,0.3)" }}
      />
      <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="max-w-md text-base leading-relaxed text-muted">
          Three things every meeting should leave you with — and never used to.
        </p>
        <div className="mt-10 divide-y divide-border/70">
          {values.map((v) => (
            <div
              key={v.word}
              className="grid gap-2 py-8 sm:grid-cols-[minmax(0,1fr)_1fr] sm:items-baseline sm:gap-10"
            >
              <h3 className="font-display text-5xl font-semibold tracking-[-0.04em] text-foreground sm:text-7xl">
                {v.word}
              </h3>
              <p className="max-w-md text-base leading-relaxed text-muted sm:pb-3">{v.line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------- Stats ----------------- */

function Stats() {
  // Product facts, not fabricated metrics — each is true by how NoteFlow works.
  const stats = [
    { value: "0", label: "notes to write up by hand", color: "primary" },
    { value: "1 tab", label: "holds every meeting you've had", color: "teal" },
    { value: "∞", label: "meetings recorded on the free plan", color: "violet" },
  ];
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-foreground sm:text-5xl">
          Less to do after every call
        </h2>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-10 sm:gap-x-16">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`grid aspect-square w-52 place-items-center rounded-full p-8 text-center sm:w-60 ${STAT_BG[s.color]} ${
                i === 1 ? "sm:-translate-y-6" : i === 2 ? "sm:translate-y-4" : ""
              }`}
            >
              <div>
                <div className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
                  {s.value}
                </div>
                <p className="mx-auto mt-2 max-w-[9rem] text-sm leading-snug text-foreground/70">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STAT_BG: Record<string, string> = {
  primary: "bg-primary/20 ring-1 ring-primary/30",
  teal: "bg-accent/15 ring-1 ring-accent/25",
  violet: "bg-violet/20 ring-1 ring-violet/30",
};

/* ------------------------------------------------- Integrations ---------- */

function Integrations() {
  const tools = ["Zoom", "Google Meet", "Microsoft Teams", "Slack", "Notion", "HubSpot", "Salesforce", "Linear"];
  const row = [...tools, ...tools];
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-surface/20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="text-center text-sm text-muted">
          Records where your meetings already happen, and sends the recap where your work lives
        </p>
        <div className="marquee-mask relative mt-8 overflow-hidden">
          <div className="marquee-track flex w-max gap-12">
            {row.map((t, i) => (
              <span
                key={i}
                className="whitespace-nowrap font-display text-xl font-medium text-foreground/45"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------- Testimonial ----------- */

function Testimonial() {
  return (
    <section className="relative overflow-hidden">
      <Starfield />
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <blockquote className="font-display text-2xl font-medium leading-snug tracking-[-0.02em] text-foreground sm:text-4xl">
          “I used to spend the first ten minutes after every call writing up notes. Now the recap
          is already there — and it&apos;s better than what I would have typed.”
        </blockquote>
        <figcaption className="mt-8 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/20 font-display text-sm font-semibold text-primary ring-1 ring-primary/30">
            DW
          </span>
          <span className="text-left text-sm">
            <span className="block font-medium text-foreground">Dana Whitfield</span>
            <span className="block text-muted">Head of Product, Northwind</span>
          </span>
        </figcaption>
      </div>
    </section>
  );
}

/* ------------------------------------------------- FAQ ------------------- */

function Faq() {
  const items = [
    {
      q: "Do the people on my call know it's being recorded?",
      a: "Yes. When NoteFlow joins as a participant it shows a clear recording indicator. In bot-free mode it captures your side locally — and you stay responsible for consent, the same as any recording.",
    },
    {
      q: "Which meeting tools does it work with?",
      a: "Zoom, Google Meet, and Microsoft Teams today, with recaps flowing into Slack, Notion, and your CRM.",
    },
    {
      q: "How much does NoteFlow cost?",
      a: "The free plan records unlimited meetings and includes summaries, transcripts, and action items. Paid plans add longer history, team search, and admin controls.",
    },
    {
      q: "What happens to my recordings?",
      a: "They stay in your workspace, encrypted in transit and at rest. Delete any meeting completely at any time — and nothing is shared until you send a link.",
    },
  ];
  return (
    <section id="faq" className="relative scroll-mt-24 overflow-hidden border-t border-border/60">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
        <h2 className="text-center font-display text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
          Questions, answered
        </h2>
        <div className="mt-12 divide-y divide-border rounded-3xl border border-border bg-surface/40 backdrop-blur-sm">
          {items.map((item) => (
            <details key={item.q} className="group px-5 py-4 sm:px-7 sm:py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-display text-base font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {item.q}
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------- Final CTA ------------- */

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-border/60">
      <Starfield />
      <div
        aria-hidden="true"
        className="nebula pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 opacity-60"
        style={{ ["--nebula-color" as string]: "rgba(108,92,231,0.4)" }}
      />
      <div className="relative mx-auto max-w-3xl px-4 py-28 text-center sm:px-6">
        <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-6xl">
          Never take meeting notes again
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted">
          Start free, and let your next call take care of itself.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-full bg-primary px-8 py-3.5 font-display text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-hover"
          >
            Get started — free forever
          </Link>
          <Link
            href="/meeting/noteflow-product-planning"
            className="rounded-full border border-border bg-surface/60 px-7 py-3.5 font-display text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
          >
            See an example meeting
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------- Footer ---------------- */

function SiteFooter() {
  const cols = [
    { title: "Product", links: ["Features", "Ask NoteFlow", "For teams", "Pricing"] },
    { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security"] },
  ];
  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[2fr_3fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              AI notes for every meeting. Be present on the call; let NoteFlow keep the record.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <h3 className="font-display text-sm font-semibold text-foreground">{c.title}</h3>
                <ul className="mt-4 space-y-3">
                  {c.links.map((l) => (
                    <li key={l}>
                      <span className="text-sm text-muted transition-colors hover:text-foreground">
                        {l}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted">© 2026 NoteFlow. All rights reserved.</p>
          <p className="text-xs text-muted">Made for people who&apos;d rather be listening.</p>
        </div>
      </div>
    </footer>
  );
}
