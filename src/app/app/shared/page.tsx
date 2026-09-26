import { SharedMeetingsList } from "@/components/app/SharedMeetingsList";

export const metadata = { title: "Shared — NoteFlow" };

export default function SharedPage() {
  return (
    <main className="relative min-w-0 flex-1 overflow-hidden px-5 py-8 sm:px-8 lg:px-10">
      {/* Extremely subtle atmosphere near the header only — the most restrained of the outputs. */}
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 z-0 hidden h-[180px] w-[40%] max-w-xl overflow-hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/assets/Wave-texture.webp)",
            backgroundSize: "cover",
            backgroundPosition: "top right",
            filter: "grayscale(1) brightness(1.3)",
            opacity: 0.05,
            WebkitMaskImage: "radial-gradient(80% 90% at 100% 0%, #000 4%, transparent 55%)",
            maskImage: "radial-gradient(80% 90% at 100% 0%, #000 4%, transparent 55%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[980px]">
        <header>
          <h1 className="text-[1.4rem] font-medium tracking-[-0.02em] nf-t">Shared</h1>
          <p className="mt-1 text-sm nf-tm">Links you&rsquo;ve made available outside NoteFlow.</p>
        </header>
        <div className="mt-7">
          <SharedMeetingsList />
        </div>
      </div>
    </main>
  );
}
