import { HighlightsList } from "@/components/app/HighlightsList";

export const metadata = { title: "Highlights — NoteFlow" };

export default function HighlightsPage() {
  return (
    <main className="relative min-w-0 flex-1 overflow-hidden px-5 py-8 sm:px-8 lg:px-10">
      {/* A slightly stronger recording/waveform character than the other output screens — but still
          faint and localized to the header negative space. */}
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 z-0 hidden h-[260px] w-[50%] max-w-3xl overflow-hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/assets/Wave-texture.webp)",
            backgroundSize: "cover",
            backgroundPosition: "top right",
            filter: "grayscale(1) brightness(1.3) contrast(1.1)",
            opacity: 0.06,
            WebkitMaskImage: "radial-gradient(85% 80% at 100% 0%, #000 6%, transparent 56%)",
            maskImage: "radial-gradient(85% 80% at 100% 0%, #000 6%, transparent 56%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1080px]">
        <header>
          <h1 className="text-[1.4rem] font-medium tracking-[-0.02em] nf-t">Highlights</h1>
          <p className="mt-1 text-sm nf-tm">Moments worth coming back to.</p>
        </header>
        <div className="mt-7">
          <HighlightsList />
        </div>
      </div>
    </main>
  );
}
