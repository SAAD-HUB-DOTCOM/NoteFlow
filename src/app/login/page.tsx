import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Waveform } from "@/components/Waveform";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getServerUser } from "@/lib/auth";

export const metadata = { title: "Sign in — NoteFlow" };

// Soft near-white button (design system forbids pure white); the colored Google glyph sits on
// the light face the way Google's mark expects, and it's the single clear action on the page.
const GOOGLE_BTN =
  "w-full inline-flex items-center justify-center gap-3 rounded-lg bg-foreground px-5 py-3.5 text-[0.95rem] font-medium text-background transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";

export default async function LoginPage() {
  const user = await getServerUser();
  if (user) redirect("/app/meetings");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-5 py-5 sm:px-8">
        <Link href="/product" aria-label="NoteFlow home" className="inline-flex rounded-lg">
          <Logo />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 pb-24 sm:px-8">
        {/* The characteristic object of a notetaker's world: a meeting mid-capture. This is the
            page's one deliberate moment — the reason you're signing in — not decoration. */}
        <section aria-hidden="true" className="mb-12">
          <div className="mb-3 flex items-center justify-between text-xs text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              Recording
            </span>
            <span className="tabular-nums">0:32</span>
          </div>
          <div className="relative h-16">
            <Waveform seed="noteflow-signin" bars={64} />
            {/* teal playhead marks how far the capture has gotten */}
            <span className="absolute inset-y-0 left-[34%] w-px bg-accent/70" />
          </div>
        </section>

        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.5rem] sm:leading-[1.1]">
          Be in the meeting.
          <br />
          NoteFlow keeps the notes.
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
          Sign in and every call you record is transcribed, summarized, and searchable the moment
          you hang up.
        </p>

        <div className="mt-9 max-w-sm">
          <GoogleSignInButton next="/app/meetings" className={GOOGLE_BTN} />
          <p className="mt-4 text-xs leading-relaxed text-muted">
            No password to set — Google signs you in and gets you started. By continuing you agree
            that you&apos;re responsible for obtaining any recording consent your meetings require.
          </p>
        </div>
      </main>
    </div>
  );
}
