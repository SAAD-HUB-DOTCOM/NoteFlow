import { ActionItemsList } from "@/components/app/ActionItemsList";

export const metadata = { title: "Action items — NoteFlow" };

export default function ActionItemsPage() {
  return (
    <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
      <div className="max-w-[820px]">
        <header>
          <h1 className="text-[1.4rem] font-medium tracking-[-0.02em] nf-t">Action items</h1>
          <p className="mt-1 text-sm nf-tm">What your conversations left to do.</p>
        </header>
        <div className="mt-7">
          <ActionItemsList />
        </div>
      </div>
    </main>
  );
}
