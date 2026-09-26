import { PersonDetail } from "@/components/app/PersonDetail";

export const metadata = { title: "Person — NoteFlow" };

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="relative min-w-0 flex-1 overflow-hidden px-5 py-8 sm:px-8 lg:px-10">
      <div className="relative z-10 max-w-[880px]">
        <PersonDetail id={id} />
      </div>
    </main>
  );
}
