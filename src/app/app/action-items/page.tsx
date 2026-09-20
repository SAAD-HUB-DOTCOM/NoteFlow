import { ActionItemsList } from "@/components/app/ActionItemsList";

export const metadata = { title: "Action items — NoteFlow" };

export default function ActionItemsPage() {
  return (
    <main className="min-w-0 flex-1 px-4 py-7 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Action items</h1>
      <p className="mt-1 text-sm text-muted">
        Follow-ups NoteFlow found across your meetings — linked to the moment they were said.
      </p>
      <div className="mt-6 max-w-reading">
        <ActionItemsList />
      </div>
    </main>
  );
}
