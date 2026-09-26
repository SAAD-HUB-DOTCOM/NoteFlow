import { getServerUser } from "@/lib/auth";
import { humanDisplayName } from "@/lib/user";
import { HomeDashboard } from "@/components/app/home/HomeDashboard";

export const metadata = { title: "Home — NoteFlow" };

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default async function HomePage() {
  const user = await getServerUser();
  const name = humanDisplayName(user); // real name from metadata, or null (never the email handle)
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = DATE_FMT.format(now).toUpperCase();

  return (
    <main className="relative min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
      {/* Atmospheric monochrome brand signature — upper-right of the canvas only, ~7% perceived. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 hidden h-[440px] w-[66%] max-w-4xl overflow-hidden md:block"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/assets/Wave-texture.webp)",
            backgroundSize: "cover",
            backgroundPosition: "top right",
            filter: "grayscale(1) brightness(1.3) contrast(1.12)",
            opacity: 0.32,
            // Clearly visible across the upper-right, easing off toward the rail content below.
            WebkitMaskImage: "radial-gradient(125% 105% at 100% 0%, #000 24%, transparent 74%)",
            maskImage: "radial-gradient(125% 105% at 100% 0%, #000 24%, transparent 74%)",
          }}
        />
      </div>

      <div className="relative z-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] nf-tf">{dateLabel}</p>
        <h1 className="mt-2 text-[clamp(1.6rem,1.3rem+1.1vw,2.15rem)] font-medium leading-[1.05] tracking-[-0.025em] nf-t">
          {greeting}
          {name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-2.5 max-w-lg text-sm leading-relaxed nf-tm">
          Your meetings are captured. The useful parts are already waiting.
        </p>

        <HomeDashboard />
      </div>
    </main>
  );
}
