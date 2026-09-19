import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getServerUser } from "@/lib/auth";

export const metadata = { title: "Sign in — NoteFlow" };

export default async function LoginPage() {
  const user = await getServerUser();
  if (user) redirect("/app/meetings");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Welcome to NoteFlow</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to capture meetings, get AI notes, and search everything you discussed.
        </p>
        <div className="mt-8 w-full rounded-xl border border-border bg-surface p-6">
          <GoogleSignInButton next="/app/meetings" />
          <p className="mt-4 text-xs leading-relaxed text-muted">
            By continuing you agree that you’re responsible for obtaining any recording consent
            required for meetings you capture with NoteFlow.
          </p>
        </div>
      </main>
    </div>
  );
}
