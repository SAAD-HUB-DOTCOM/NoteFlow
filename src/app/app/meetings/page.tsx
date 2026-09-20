import { MeetingsList } from "@/components/app/MeetingsList";
import { AskSidebar } from "@/components/app/AskSidebar";

/**
 * My Meetings (authenticated) — real captured meetings from the backend (GET /api/v1/meetings),
 * no seeded data. Ask NoteFlow answers across the user's real meetings (POST /api/v1/ask).
 */
export const metadata = { title: "My Meetings — NoteFlow" };

export default function MeetingsPage() {
  return (
    <>
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Meetings</h1>
        <p className="mt-1 text-sm text-muted">
          Your recorded meetings, captured and transcribed automatically.
        </p>
        <div className="mt-6">
          <MeetingsList />
        </div>
      </main>

      <div className="hidden w-[360px] shrink-0 lg:block">
        <AskSidebar />
      </div>
    </>
  );
}
