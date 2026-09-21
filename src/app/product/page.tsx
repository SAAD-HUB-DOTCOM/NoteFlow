import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { Starfield } from "@/components/landing/Starfield";
import { HeroVideo } from "@/components/landing/HeroVideo";
import { TeamsTabs } from "@/components/landing/TeamsTabs";
import { ProductBeats } from "@/components/landing/ProductBeats";
import { Pillars } from "@/components/landing/Pillars";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { IntegrationsConstellation } from "@/components/landing/IntegrationsConstellation";
import { ExtensionDownload } from "@/components/landing/ExtensionDownload";
import { StarEyebrow, Star4 } from "@/components/landing/StarEyebrow";
import { LockIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "NoteFlow — AI notes for every meeting",
  description:
    "NoteFlow records, transcribes, and summarizes your calls, then hands you the recap, action items, and answers before you've closed the tab. Now recording bot-free.",
};

// Built section-by-section against DESIGN.md §5 (product page anatomy):
// hero → beats slider → marquee → audience tabs → 3 pillars → stats → how-it-works →
// integrations constellation → FAQ → gradient-band CTA → mega footer.
export default function ProductPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <LandingNav />
      <main>
        <Hero />
        <BeatsSection />
        <Marquee />
        <AudienceSection />
        <PillarsSection />
        <Stats />
        <HowItWorksSection />
        <IntegrationsSection />
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
    <section className="relative -mt-16 flex min-h-[100svh] items-center overflow-hidden pt-16">
      <Starfield />
      {/* cinematic cosmic loop over the starfield; falls back to the still starfield when the
          visitor prefers reduced motion. Sits behind the transparent nav so the two merge. */}
      <HeroVideo />
      {/* one nebula glow anchors the composition — the only large light in the hero */}
      <div
        aria-hidden="true"
        className="nebula pointer-events-none absolute -left-40 top-1/4 h-[32rem] w-[32rem] opacity-60"
        style={{ ["--nebula-color" as string]: "rgba(150,0,255,0.4)" }}
      />

      {/* minimalist hero: headline + one line + one CTA + trust line, balanced by the visual.
          Vertically centered so it reads as one clean screen (DESIGN.md §5, Fathom hero). */}
      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14">
        <div className="animate-rise-in">
          <h1 className="font-display text-[clamp(2.25rem,1.7rem+2.4vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground text-balance">
            <span className="font-normal">Focus on the conversation.</span>
            <span className="block">
              NoteFlow <span className="text-gradient-brand">keeps the record.</span>
            </span>
          </h1>
          <p className="mt-5 max-w-md text-p-medium leading-relaxed text-muted">
            NoteFlow summarizes every call the moment you hang up.{" "}
            <strong className="font-medium text-foreground">Now recording bot-free.</strong>
          </p>
          <div className="mt-7">
            <ExtensionDownload compact />
          </div>
          <p className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-2 text-foreground/70">
              <LockIcon className="h-3.5 w-3.5" />
              SOC 2 Type II
            </span>
            {["GDPR", "HIPAA", "SSO / SCIM"].map((b) => (
              <span key={b} className="border-l border-border pl-4">
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

/* ----------------------------------------------- Beats slider (§2.9) ------ */

function BeatsSection() {
  return (
    <section id="features" className="relative scroll-mt-24 overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
        <ProductBeats />
      </div>
    </section>
  );
}

/* ----------------------------------------------- Marquee (§3) ------------- */

function Marquee() {
  // One authored phrase, gradient-clipped keyword; a single slow continuous drift.
  const unit = Array.from({ length: 4 });
  return (
    <section aria-hidden="true" className="relative overflow-hidden border-y border-border/60 py-8 sm:py-10">
      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-10 sm:gap-14">
          {[...unit, ...unit].map((_, i) => (
            <div key={i} className="flex items-center gap-10 sm:gap-14">
              <span className="whitespace-nowrap font-display text-4xl font-normal tracking-[-0.03em] text-foreground/85 sm:text-6xl">
                Turn <span className="font-semibold text-gradient-brand">talk</span> into action
              </span>
              <Star4 className="h-4 w-4 shrink-0 text-brand-yellow sm:h-5 sm:w-5" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------- Audience tabs (§5.5) ----- */

function AudienceSection() {
  return (
    <section id="teams" className="relative scroll-mt-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="mx-auto max-w-3xl text-center font-display text-h2 font-normal text-foreground text-balance">
          Whether it&apos;s one call or one thousand,{" "}
          <span className="font-semibold">NoteFlow remembers every meeting</span>
        </h2>
        <div className="mt-14">
          <TeamsTabs />
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------- 3 pillars (§2.10) -------- */

function PillarsSection() {
  return (
    <section id="ask" className="relative scroll-mt-24 overflow-hidden border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-14 max-w-2xl">
          <StarEyebrow hue="cyan">Everything a meeting should leave you with</StarEyebrow>
          <h2 className="mt-4 font-display text-h2 font-normal text-foreground text-balance">
            Three things every call should give back
          </h2>
        </div>
        <Pillars />
      </div>
    </section>
  );
}

/* ------------------------------------------------- Stats (§2.11) --------- */

function Stats() {
  // Product facts, not fabricated metrics — each is true by how NoteFlow works.
  const stats = [
    { value: "0", label: "notes to write up by hand", color: "orange" },
    { value: "1 tab", label: "holds every meeting you've had", color: "cyan" },
    { value: "∞", label: "meetings recorded on the free plan", color: "pink" },
  ];
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="mx-auto max-w-2xl text-center font-display text-h2 font-normal text-foreground text-balance">
          Less to do after <span className="font-semibold">every call</span>
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
  orange: "bg-brand-orange/15 ring-1 ring-brand-orange/40",
  cyan: "bg-brand-cyan/15 ring-1 ring-brand-cyan/40",
  pink: "bg-brand-pink/15 ring-1 ring-brand-pink/40",
};

/* ----------------------------------------------- How it works (§2.12) ---- */

function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/60">
      <Starfield />
      <div className="relative mx-auto max-w-5xl px-4 py-24 sm:px-6 sm:py-32">
        <HowItWorks />
      </div>
    </section>
  );
}

/* ----------------------------------------------- Integrations (§2.13) ---- */

function IntegrationsSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <StarEyebrow hue="yellow" align="center">
            Zero friction, maximum flexibility
          </StarEyebrow>
          <h2 className="mt-4 font-display text-h2 font-normal text-foreground text-balance">
            Works <span className="font-semibold">where you meet</span>
          </h2>
        </div>
        <div className="mt-16">
          <IntegrationsConstellation />
        </div>
        <p className="mx-auto mt-14 max-w-xl text-center text-p-regular leading-relaxed text-muted">
          NoteFlow records where your meetings already happen and sends the recap where your work
          lives — no new habits to learn.
        </p>
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
        <h2 className="text-center font-display text-h2 font-normal text-foreground text-balance">
          Questions, <span className="font-semibold">answered</span>
        </h2>
        <div className="mt-12 divide-y divide-border rounded-boxed border border-border bg-surface/40 backdrop-blur-sm">
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

/* ----------------------------------------------- Final CTA band (§2.15) -- */

function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      {/* full-bleed pink→purple gradient band */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(120deg, #FFA8BB 0%, #F55200 40%, #9600FF 100%)" }}
      />
      {/* soft light scrim behind the copy so near-black text clears contrast on the darker end */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[26rem] w-[46rem] max-w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(255,245,235,0.55), transparent 75%)" }}
      />
      <div className="relative mx-auto max-w-3xl px-4 py-28 text-center sm:px-6 sm:py-36">
        <StarEyebrow hue="black" align="center">
          Never miss what matters
        </StarEyebrow>
        <h2 className="mt-5 font-display text-h2 font-normal leading-[1.05] text-[#0E0E10] text-balance">
          Stop guessing. Ask NoteFlow.
          <span className="block font-semibold">Start today, for free.</span>
        </h2>
        <div className="mt-10 flex flex-col items-center gap-5">
          <a
            href="/noteflow-extension.zip"
            download
            className="inline-flex items-center gap-2 rounded-full bg-[#0E0E10] px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-wide text-brand-yellow shadow-[0_18px_44px_-14px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out hover:-translate-y-0.5"
          >
            Get started — it&apos;s free
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
            </svg>
          </a>
          <Link
            href="/meeting/noteflow-product-planning"
            className="font-display text-sm font-medium text-[#0E0E10]/80 underline decoration-[#0E0E10]/40 underline-offset-[6px] transition-colors hover:decoration-[#0E0E10]"
          >
            or see an example meeting
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------- Footer (§2.16) -------- */

function SiteFooter() {
  const cols = [
    { title: "Product", links: ["Features", "Ask NoteFlow", "For teams", "Pricing"] },
    { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security"] },
  ];
  const year = 2026;
  return (
    <footer className="relative border-t border-border bg-offblack">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[2fr_3fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              AI notes for every meeting. Be present on the call; let NoteFlow keep the record.
            </p>
            <Link
              href="/login"
              className="btn-grad mt-6 inline-flex px-5 py-2.5 text-sm font-semibold uppercase tracking-wide"
            >
              Try NoteFlow today
            </Link>
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
          <p className="text-xs text-muted">© {year} NoteFlow. All rights reserved.</p>
          <p className="text-xs text-muted">Made for people who&apos;d rather be listening.</p>
        </div>
      </div>
    </footer>
  );
}
