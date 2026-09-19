import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMeeting, meetings } from "@/data/meetings";
import { Logo } from "@/components/Logo";
import { ShareIcon } from "@/components/icons";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { MeetingWorkspace } from "@/components/workspace/MeetingWorkspace";

/**
 * Public share page (PLAN §4 / §8). A read-only view of a meeting for someone who wasn't on the
 * call — summary (with templates), synchronized transcript with search/highlights, and action
 * items shown as status only. No Ask tab, no editing. Prerendered for every seeded meeting so a
 * share link opens instantly for a signed-out visitor.
 */
export function generateStaticParams() {
  return meetings.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const meeting = getMeeting(id);
  return {
    title: meeting ? `${meeting.title} — shared on NoteFlow` : "Shared meeting — NoteFlow",
  };
}

export default async function SharePage({
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted">
            <ShareIcon className="h-3.5 w-3.5" />
            Shared · read-only
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <p className="mb-5 text-sm text-muted">
          Someone shared this meeting with you. You can read the summary, play the recording in
          sync with the transcript, and review the action items.
        </p>

        <WorkspaceHeader meeting={meeting} />

        <div className="mt-8">
          <MeetingWorkspace meeting={meeting} readOnly />
        </div>
      </main>
    </div>
  );
}
