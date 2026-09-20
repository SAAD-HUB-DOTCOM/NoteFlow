import { HighlightsList } from "@/components/app/HighlightsList";

export const metadata = { title: "Highlights — NoteFlow" };

export default function HighlightsPage() {
  return (
    <main className="min-w-0 flex-1 px-4 py-7 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Highlights</h1>
      <p className="mt-1 text-sm text-muted">
        The key moments NoteFlow detected across your meetings — each linked to the recording.
      </p>
      <div className="mt-6 max-w-reading">
        <HighlightsList />
      </div>
    </main>
  );
}
