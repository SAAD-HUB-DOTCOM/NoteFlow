import { Skeleton } from "@/components/Skeleton";

/** Dashboard loading skeleton — holds the layout so nothing jumps when data arrives. */
export default function Loading() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-64" />
        <Skeleton className="mb-8 mt-6 h-11 w-full" />
        <Skeleton className="mb-3 h-4 w-20" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-stretch gap-4 rounded-xl border border-border bg-surface p-4 sm:gap-5 sm:p-5"
            >
              <Skeleton className="hidden h-20 w-28 shrink-0 sm:block sm:w-32" />
              <div className="flex-1 space-y-2.5 py-1">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
