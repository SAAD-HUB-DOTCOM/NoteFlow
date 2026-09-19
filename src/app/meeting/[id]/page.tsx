import Link from "next/link";
import { notFound } from "next/navigation";
import { getMeeting, meetings } from "@/data/meetings";
import { Logo } from "@/components/Logo";
import { ChevronRightIcon } from "@/components/icons";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { MeetingWorkspace } from "@/components/workspace/MeetingWorkspace";

/** Pre-render every seeded meeting's workspace at build time. */
export function generateStaticParams() {
  return meetings.map((m) => ({ id: m.id }));
}

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

        <div className="mt-5">
          <WorkspaceHeader meeting={meeting} />
        </div>

        <div className="mt-8">
          <MeetingWorkspace meeting={meeting} />
        </div>
      </main>
    </div>
  );
}
