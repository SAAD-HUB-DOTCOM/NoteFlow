import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Starfield } from "@/components/landing/Starfield";
import { getServerUser } from "@/lib/auth";

export const metadata = { title: "Sign in — NoteFlow" };

const GOOGLE_BTN =
  "w-full inline-flex items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 font-display text-[0.95rem] font-semibold text-[#14141f] shadow-lg shadow-black/30 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

export default async function LoginPage() {
  const user = await getServerUser();
  if (user) redirect("/app/meetings");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <Starfield />
      <div
        aria-hidden="true"
        className="nebula pointer-events-none absolute -left-40 top-20 h-[34rem] w-[34rem] opacity-60"
        style={{ ["--nebula-color" as string]: "rgba(108,92,231,0.4)" }}
      />
      <div
        aria-hidden="true"
        className="nebula pointer-events-none absolute -right-24 bottom-0 h-[28rem] w-[28rem] opacity-50"
        style={{ ["--nebula-color" as string]: "rgba(0,217,192,0.16)" }}
      />

      {/* centered wordmark */}
      <header className="relative z-10 flex justify-center px-4 py-7">
        <Link href="/product" aria-label="NoteFlow home" className="rounded-lg">
          <Logo />
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-5xl flex-1 items-center gap-16 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-24">
        {/* sign-in card */}
        <div className="w-full rounded-3xl border border-border bg-surface/50 p-7 backdrop-blur-md sm:p-9">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
            Sign in to NoteFlow
          </h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
            One click in, and your meetings start writing themselves up.
          </p>

          <div className="mt-8">
            <GoogleSignInButton next="/app/meetings" className={GOOGLE_BTN} />
          </div>

          <p className="mt-5 text-sm text-muted">
            No password to set — the same button signs you in and gets you started.
          </p>

          <p className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted">
            By continuing you agree that you&apos;re responsible for obtaining any recording
            consent required for the meetings you capture with NoteFlow.
          </p>
        </div>

        {/* testimonial — illustrative, single quote (no fabricated ratings or logos) */}
        <figure className="hidden lg:block">
          <span
            aria-hidden="true"
            className="block font-display text-7xl leading-none text-primary/60"
          >
            &ldquo;
          </span>
          <blockquote className="-mt-4 max-w-lg font-display text-3xl font-medium leading-snug tracking-[-0.02em] text-foreground">
            I haven&apos;t written up a meeting in months. I hang up, and the recap is already
            there — sharper than anything I would have typed.
          </blockquote>
          <figcaption className="mt-7 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/20 font-display text-sm font-semibold text-primary ring-1 ring-primary/30">
              DW
            </span>
            <span className="text-sm">
              <span className="block font-medium text-foreground">Dana Whitfield</span>
              <span className="block text-muted">Head of Product, Northwind</span>
            </span>
          </figcaption>
          <p className="mt-12 text-sm text-muted">
            Records right where your meetings happen — Zoom, Google Meet, and Microsoft Teams.
          </p>
        </figure>
      </main>
    </div>
  );
}
