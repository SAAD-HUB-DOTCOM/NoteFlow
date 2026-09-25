import { getServerUser } from "@/lib/auth";
import { nameFromEmail } from "@/lib/user";
import { HomeDashboard } from "@/components/app/home/HomeDashboard";

export const metadata = { title: "Home — NoteFlow" };

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default async function HomePage() {
  const user = await getServerUser();
  const name = nameFromEmail(user?.email);
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = DATE_FMT.format(now).toUpperCase();

  return (
    <main className="relative min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
      {/* Subtle monochrome brand signature in the upper-right — never over the content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 hidden h-72 w-[48%] max-w-3xl overflow-hidden md:block"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/assets/Wave-texture.png)",
            backgroundSize: "cover",
            backgroundPosition: "center right",
            filter: "grayscale(1) brightness(0.9)",
            opacity: 0.1,
            WebkitMaskImage: "radial-gradient(120% 100% at 100% 0%, #000, transparent 68%)",
            maskImage: "radial-gradient(120% 100% at 100% 0%, #000, transparent 68%)",
          }}
        />
      </div>

      <div className="relative z-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] nf-tf">{dateLabel}</p>
        <h1 className="mt-2 text-[clamp(2rem,1.4rem+2.2vw,3rem)] font-medium leading-[1.02] tracking-[-0.03em] nf-t">
          {greeting}, {name}.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed nf-t2">
          Your meetings are captured. The useful parts are already waiting.
        </p>

        <HomeDashboard />
      </div>
    </main>
  );
}
