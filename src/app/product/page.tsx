import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LandingNav } from "@/components/landing/LandingNav";
import { Starfield } from "@/components/landing/Starfield";
import { HeroVideo } from "@/components/landing/HeroVideo";
import { TeamsTabs } from "@/components/landing/TeamsTabs";
import { ProductBeats } from "@/components/landing/ProductBeats";
import { Pillars } from "@/components/landing/Pillars";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { IntegrationsConstellation } from "@/components/landing/IntegrationsConstellation";
import { TeamStats } from "@/components/landing/TeamStats";
import { StarEyebrow, Star4 } from "@/components/landing/StarEyebrow";
import { MicIcon, SparkleIcon, CheckIcon } from "@/components/icons";

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
        <TeamStats />
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
    <section className="relative -mt-16 flex min-h-[100svh] flex-col overflow-hidden pt-16">
      {/* full-bleed background loop (optimized fast-start 720p), per the Vesper reference */}
      <HeroVideo />

      <div
        className="vsp-grain pointer-events-none absolute inset-0 z-20"
        aria-hidden="true"
      >
        <svg
          className="block h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <filter id="vsp-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#vsp-noise)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-end px-5 pb-12 text-center sm:pb-[85px]">
        <div
          className="vsp-badge vsp-appear vsp-pop mb-[22px] inline-flex items-center gap-2 rounded-[5px] px-[15px] py-[9px] text-[12.5px] tracking-[-0.01em] text-[#f2f2f2]"
          style={{ ["--d" as string]: "0.22s" }}
        >
          <Star4 className="vsp-star h-[18px] w-[18px] text-white" />
          <span>AI meeting notetaker</span>
        </div>

        <h1 className="vsp-h1 font-display text-[clamp(2.125rem,1rem+2.2vw,4rem)] font-medium leading-[1.12] tracking-[-0.045em] text-foreground">
          <span className="vsp-line">
            <span
              className="vsp-appear vsp-mask block"
              style={{ ["--d" as string]: "0.42s" }}
            >
              Be in the <em>conversation</em>,
            </span>
          </span>
          <span className="vsp-line">
            <span
              className="vsp-appear vsp-mask block"
              style={{ ["--d" as string]: "0.62s" }}
            >
              not in your notes.
            </span>
          </span>
        </h1>

        <p
          className="vsp-appear vsp-soft mt-[18px] max-w-[470px] text-[15.5px] leading-[1.55] tracking-[-0.015em] text-[#9a9a9a]"
          style={{ ["--d" as string]: "0.82s" }}
        >
          NoteFlow records, transcribes, and summarizes every meeting — the
          recap, action items, and answers are ready the moment you hang up.
        </p>

        <div className="mt-[26px] flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/login"
            className="vsp-btn vsp-btn-solid vsp-appear vsp-btn-in inline-flex h-[42px] items-center rounded-md px-[18px] text-[13.5px] font-medium tracking-[-0.02em]"
            style={{ ["--d" as string]: "0.96s" }}
          >
            Start for free
          </Link>
          <Link
            href="/meeting/noteflow-product-planning"
            className="vsp-btn vsp-btn-ghost vsp-appear vsp-side inline-flex h-[42px] items-center rounded-md px-[18px] text-[13.5px] font-medium tracking-[-0.02em]"
            style={{ ["--d" as string]: "1.1s" }}
          >
            See a live recap
          </Link>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-9 sm:px-12">
        <div className="flex flex-col items-center justify-between gap-4 text-[13.5px] tracking-[-0.015em] text-[#d8d8d8] sm:flex-row">
          <span
            className="vsp-appear vsp-stat inline-flex items-center gap-3.5"
            style={{ ["--d" as string]: "1.12s" }}
          >
            <MicIcon className="h-5 w-5 text-[#e8e8e8]" />
            Records on Meet, Zoom &amp; Teams
          </span>
          <span
            className="vsp-appear vsp-stat inline-flex items-center gap-3.5"
            style={{ ["--d" as string]: "1.28s" }}
          >
            <SparkleIcon className="h-5 w-5 text-[#e8e8e8]" />
            Recap ready the moment you hang up
          </span>
          <span
            className="vsp-appear vsp-stat inline-flex items-center gap-3.5"
            style={{ ["--d" as string]: "1.44s" }}
          >
            <CheckIcon className="h-5 w-5 text-[#e8e8e8]" />
            Unlimited meetings on the free plan
          </span>
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

function Marquee() {
  const unit = Array.from({ length: 4 });
  return (
    <section
      aria-hidden="true"
      className="relative overflow-hidden border-y border-border/60 py-8 sm:py-10"
    >
      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-10 sm:gap-14">
          {[...unit, ...unit].map((_, i) => (
            <div key={i} className="flex items-center gap-10 sm:gap-14">
              <span className="whitespace-nowrap font-display text-4xl font-normal tracking-[-0.03em] text-foreground/85 sm:text-6xl">
                Turn{" "}
                <span className="font-semibold text-gradient-brand">talk</span>{" "}
                into action
              </span>
              <Star4 className="h-4 w-4 shrink-0 text-brand-yellow sm:h-5 sm:w-5" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceSection() {
  return (
    <section id="teams" className="relative scroll-mt-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="mx-auto max-w-3xl text-center font-display text-h2 font-normal text-foreground text-balance">
          Whether it&apos;s one call or one thousand,{" "}
          <span className="font-semibold">
            NoteFlow remembers every meeting
          </span>
        </h2>
        <div className="mt-14">
          <TeamsTabs />
        </div>
      </div>
    </section>
  );
}

// The pillars are a GSAP scroll-pinned switcher that owns its own section shell + heading
// (DESIGN.md §2.10) — see components/landing/Pillars.tsx.
function PillarsSection() {
  return <Pillars />;
}

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
          NoteFlow records where your meetings already happen and sends the
          recap where your work lives — no new habits to learn.
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
    <section
      id="faq"
      className="relative scroll-mt-24 overflow-hidden border-t border-border/60"
    >
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
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                {item.a}
              </p>
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
        style={{
          background:
            "linear-gradient(120deg, #FFA8BB 0%, #F55200 40%, #9600FF 100%)",
        }}
      />
      {/* soft light scrim behind the copy so near-black text clears contrast on the darker end */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[26rem] w-[46rem] max-w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,245,235,0.55), transparent 75%)",
        }}
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
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
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
    {
      title: "Product",
      links: ["Features", "Ask NoteFlow", "For teams", "Pricing"],
    },
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
              AI notes for every meeting. Be present on the call; let NoteFlow
              keep the record.
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
                <h3 className="font-display text-sm font-semibold text-foreground">
                  {c.title}
                </h3>
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
          <p className="text-xs text-muted">
            © {year} NoteFlow. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Made for people who&apos;d rather be listening.
          </p>
        </div>
      </div>
    </footer>
  );
}
