import { MeetingsLibrary } from "@/components/app/MeetingsLibrary";

/**
 * Meetings — the personal conversation library (authenticated). Real captured meetings from the
 * backend (GET /api/v1/meetings), grouped and filtered client-side over the real DTO fields.
 * Global Ask lives in the app top bar; this screen's search is the library filter, not Ask.
 */
export const metadata = { title: "Meetings — NoteFlow" };

export default function MeetingsPage() {
  return (
    <main className="relative min-w-0 flex-1 overflow-hidden px-5 py-8 sm:px-8 lg:px-10">
      {/* Meetings-specific brand atmosphere: a broad NoteFlow ribbon that emerges from the black
          upper-right canvas and dissolves toward the library. Larger + more present than a mere
          texture, but a different crop/placement than Home's canvas wave — it activates the
          otherwise unused right column instead of leaving a dead gap. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 hidden h-[640px] w-[680px] max-w-[52vw] overflow-hidden lg:block"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/assets/Wave-texture.webp)",
            backgroundSize: "150% auto",
            backgroundPosition: "top right",
            filter: "grayscale(1) brightness(1.4) contrast(1.12)",
            opacity: 0.2,
            WebkitMaskImage:
              "radial-gradient(92% 88% at 100% 12%, #000 8%, rgba(0,0,0,0.5) 40%, transparent 70%)",
            maskImage:
              "radial-gradient(92% 88% at 100% 12%, #000 8%, rgba(0,0,0,0.5) 40%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1240px]">
        <header>
          <h1 className="text-[1.4rem] font-medium tracking-[-0.02em] nf-t">Meetings</h1>
          <p className="mt-1 text-sm nf-tm">Everything NoteFlow has captured.</p>
        </header>

        <div className="mt-6">
          <MeetingsLibrary />
        </div>
      </div>
    </main>
  );
}
