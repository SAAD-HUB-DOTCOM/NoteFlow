import Link from "next/link";

export function AskWorkspace() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-20">
          <h2 className="font-display text-h2 font-medium leading-[1.06] tracking-[-0.02em] text-foreground">
            One home for
            <br />
            every meeting.
          </h2>
          <div className="lg:pt-1.5">
            <p className="max-w-xl text-lg leading-relaxed tracking-[-0.01em] sm:text-[21px] sm:leading-[1.5]">
              <span className="text-foreground">
                Every call NoteFlow joins lands here
              </span>{" "}
              <span className="text-muted">
                transcribed, summarized, and ready to search. Ask about any
                meeting and the answer comes back with the exact moment it was
                said.
              </span>
            </p>
            <Link
              href="/meeting/noteflow-product-planning"
              className="group mt-7 inline-flex items-center gap-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"
            >
              See a live recap
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-[3px]"
                aria-hidden="true"
              >
                <path d="M9.75 4.75 13.25 8m0 0-3.5 3.25M13.25 8H2.75" />
              </svg>
            </Link>
          </div>
        </div>
        {/* visual bleeds past the text column on desktop, with the right edge melting into
            black (reference treatment) so the composition reads as part of the canvas */}
        <div className="relative mt-12 sm:mt-16 lg:-mx-16 xl:-mx-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/visual.webp"
            alt="The NoteFlow dashboard listing captured meetings next to the Ask panel answering questions about a call"
            loading="lazy"
            className="h-auto w-full"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-2/5"
            style={{
              background:
                "linear-gradient(to left, #000 4%, rgba(0,0,0,0.55) 34%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
