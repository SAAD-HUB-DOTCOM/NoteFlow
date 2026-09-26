import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { MicIcon, ChecklistIcon } from "@/components/icons";
import { getServerUser } from "@/lib/auth";

export const metadata = { title: "Sign in — NoteFlow" };

const REC_BARS = Array.from({ length: 60 }, (_, i) => {
  const t = i / 59;
  const envelope = Math.sin(t * Math.PI) * 0.45 + 0.55;
  const s = Math.sin(i * 127.1 + 4.3) * 43758.5453;
  const rnd = s - Math.floor(s); // 0..1, stable
  return Math.round((0.28 + rnd * 0.72) * envelope * 100);
});

// Near-white CTA (the design system reserves pure white; `foreground` is the sanctioned face).
const GOOGLE_BTN =
  "relative w-full inline-flex items-center justify-center gap-3 rounded-xl bg-foreground px-6 py-4 text-[0.95rem] font-semibold text-background transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function EqualizerIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 9v6M10 6v12M14 8v8M18 10.5v3" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <MicIcon className="h-4 w-4" />,
    title: "Record",
    sub: "On Meet, Zoom & Teams",
  },
  {
    icon: <EqualizerIcon className="h-4 w-4" />,
    title: "Transcribe",
    sub: "Accurate, multi-speaker",
  },
  {
    icon: <ChecklistIcon className="h-4 w-4" />,
    title: "Summarize",
    sub: "Action items, follow-ups",
  },
];

export default async function LoginPage() {
  const user = await getServerUser();
  if (user) redirect("/app/meetings");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Light bloom behind the wave — the premium "glow" the particles catch. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[6%] z-0 h-[42vh] w-[85%] max-w-[880px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(closest-side, rgba(150,190,255,0.12), rgba(255,255,255,0.06) 42%, transparent 72%)",
          filter: "blur(22px)",
        }}
      />
      {/* Wave texture — centered as a top band, faded well before the headline. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-0 w-[125%] max-w-[1500px] -translate-x-1/2 select-none sm:w-[108%]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/Wave-texture.webp"
          alt=""
          // Decorative top band, but above the fold — fetch it promptly so it paints with the page.
          fetchPriority="high"
          decoding="async"
          className="w-full opacity-80"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, #000 16%, #000 40%, transparent 66%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, #000 16%, #000 40%, transparent 66%)",
          }}
        />
      </div>
      {/* Readability scrim — keeps the lower half near-black so the copy and CTA stay crisp. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,0,0.55) 52%, rgba(0,0,0,0.92) 72%, #000 100%)",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/product"
          aria-label="NoteFlow home"
          className="inline-flex rounded-lg"
        >
          <Logo />
        </Link>
        <Link
          href="/product#teams"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-foreground/90 backdrop-blur-md transition-colors hover:bg-white/10"
        >
          For teams
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Centered sign-in column */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        {/* Recording card — the one deliberate object: a meeting mid-capture. */}
        <div
          aria-hidden="true"
          className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 px-5 py-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-2 font-medium text-foreground/90">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
              </span>
              Recording
            </span>
            <span className="tabular-nums text-muted">0:32</span>
          </div>
          <div className="mt-3 flex h-12 items-center justify-between gap-[2px]">
            {REC_BARS.map((h, i) => (
              <span
                key={i}
                className="w-full rounded-full bg-white"
                style={{
                  height: `${Math.max(h, 8)}%`,
                  opacity: 0.45 + (h / 100) * 0.5,
                }}
              />
            ))}
          </div>
        </div>

        <h1 className="mt-12 font-display text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-[3.25rem] sm:leading-[1.05]">
          Be in the meeting,
          <br />
          not <span className="text-muted">in your notes.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted">
          NoteFlow records, transcribes, and summarizes every meeting. The
          recap, action items, and answers are ready the moment you hang up.
        </p>

        <div className="mt-9 w-full max-w-md">
          <GoogleSignInButton
            next="/app/meetings"
            className={GOOGLE_BTN}
            trailing={
              <ArrowRight className="absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-background/60" />
            }
          />
          <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-muted">
            No password to set — Google signs you in and gets you started. By
            continuing you agree that you&apos;re responsible for obtaining any
            recording consent your meetings require.
          </p>
        </div>
      </main>
    </div>
  );
}
