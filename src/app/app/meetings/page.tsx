import { MeetingsLibrary } from "@/components/app/MeetingsLibrary";

/**
 * Meetings — the personal conversation library (authenticated). Real captured meetings from the
 * backend (GET /api/v1/meetings), grouped and filtered client-side over the real DTO fields.
 * Global Ask lives in the app top bar; this screen's search is the library filter, not Ask.
 */
export const metadata = { title: "Meetings — NoteFlow" };

export default function MeetingsPage() {
  return (
    <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
      <header>
        <h1 className="text-[1.4rem] font-medium tracking-[-0.02em] nf-t">Meetings</h1>
        <p className="mt-1 text-sm nf-tm">Everything NoteFlow has captured.</p>
      </header>

      <div className="mt-6">
        <MeetingsLibrary />
      </div>
    </main>
  );
}
