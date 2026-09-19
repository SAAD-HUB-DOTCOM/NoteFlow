import { MicIcon } from "@/components/icons";
import { RecordMeetingButton } from "@/components/app/RecordMeetingButton";

/**
 * My Meetings (authenticated). Phase 2 ships the real, honest shell: a signed-in user with no
 * captured meetings sees an empty state — NOT seed data (NO-HARDCODED rule). The live list from
 * GET /api/v1/meetings and the rich MeetingCard reuse are wired in Phase 6, once real captured
 * meetings exist.
 */
export const metadata = { title: "My Meetings — NoteFlow" };

export default function MeetingsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">My Meetings</h1>
      <p className="mt-1.5 text-sm text-muted">Your captured meetings will appear here.</p>

      <div className="mt-8 rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-border bg-surface">
          <MicIcon className="h-5 w-5 text-muted" />
        </div>
        <p className="text-base font-medium text-foreground">No meetings yet</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
          Record your first meeting and NoteFlow will capture it, transcribe it, and write the
          summary, action items, and highlights for you.
        </p>
        <div className="mt-5 flex justify-center">
          <RecordMeetingButton label="Record a meeting" />
        </div>
      </div>
    </main>
  );
}
