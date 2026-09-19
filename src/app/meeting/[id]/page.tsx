import Link from "next/link";
import { notFound } from "next/navigation";
import { getMeeting } from "@/data/meetings";
import { Logo } from "@/components/Logo";
import { ChevronRightIcon } from "@/components/icons";

/**
 * Phase-1 placeholder for the meeting workspace.
 *
 * The real workspace — player, synchronized transcript, summary, action items, Ask NoteFlow —
 * is Phase 2 (PLAN §8, hours 4–10). This stub exists only so the dashboard's card links resolve
 * to a real, branded page instead of a 404 in the meantime. It is intentionally not the
 * workspace shell.
 */
export default async function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meeting = getMeeting(id);
  if (!meeting) notFound();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <nav className="flex items-center gap-1 text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-foreground">
            My Meetings
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="text-foreground/80">{meeting.title}</span>
        </nav>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          {meeting.title}
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          {meeting.summary.tldr}
        </p>

        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
          <p className="text-base font-medium text-foreground">Workspace coming in Phase 2</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
            The player, synchronized transcript, summary, action items, and Ask NoteFlow live
            here next. For now, head back to browse the seeded meetings.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Back to My Meetings
          </Link>
        </div>
      </main>
    </div>
  );
}
