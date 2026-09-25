import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

/**
 * Honest scaffold for a destination whose backend data contract doesn't exist yet
 * (REDESIGN.md §3 / §14 / §15): describes what the screen will do and states plainly that
 * it isn't connected — never fabricated analytics. Keeps the nav complete without lying.
 */
export function ComingScreen({
  eyebrow,
  title,
  description,
  detail,
}: {
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
}) {
  return (
    <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] nf-tf">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-medium tracking-[-0.02em] nf-t">{title}</h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed nf-t2">{description}</p>

      <div className="mt-8 max-w-2xl nf-card p-6">
        <p className="text-sm leading-relaxed nf-tm">{detail}</p>
        <Link href="/app/meetings" className="mt-4 inline-flex items-center gap-1 text-sm nf-t2 transition-colors hover:text-[color:var(--nf-text)]">
          Go to your meetings <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
