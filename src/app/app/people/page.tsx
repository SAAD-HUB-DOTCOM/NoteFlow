import { PeopleDirectory } from "@/components/app/PeopleDirectory";

export const metadata = { title: "People — NoteFlow" };

export default function PeoplePage() {
  return (
    <main className="relative min-w-0 flex-1 overflow-hidden px-5 py-8 sm:px-8 lg:px-10">
      {/* Restrained brand atmosphere in the upper-right canvas — the same quiet motif used across
          Home / Meetings / Intelligence, so People sits beside them rather than reading as a
          separate product. Fades out well before the list. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 hidden h-[320px] w-[46%] max-w-2xl overflow-hidden lg:block"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/assets/Wave-texture.webp)",
            backgroundSize: "cover",
            backgroundPosition: "top right",
            filter: "grayscale(1) brightness(1.3) contrast(1.1)",
            opacity: 0.06,
            WebkitMaskImage: "radial-gradient(88% 82% at 100% 0%, #000 6%, transparent 58%)",
            maskImage: "radial-gradient(88% 82% at 100% 0%, #000 6%, transparent 58%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[880px]">
        <header>
          <h1 className="text-[1.4rem] font-medium tracking-[-0.02em] nf-t">People</h1>
          <p className="mt-1 text-sm nf-tm">People you’ve identified across your conversations.</p>
        </header>

        <div className="mt-8">
          <PeopleDirectory />
        </div>
      </div>
    </main>
  );
}
