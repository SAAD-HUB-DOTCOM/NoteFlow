import { SharedMeetingsList } from "@/components/app/SharedMeetingsList";

export const metadata = { title: "Shared — NoteFlow" };

export default function SharedPage() {
  return (
    <main className="min-w-0 flex-1 px-4 py-7 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shared</h1>
      <p className="mt-1 text-sm text-muted">
        Meetings you’ve shared with a public read-only link. Revoke any link at any time.
      </p>
      <div className="mt-6 max-w-reading">
        <SharedMeetingsList />
      </div>
    </main>
  );
}
