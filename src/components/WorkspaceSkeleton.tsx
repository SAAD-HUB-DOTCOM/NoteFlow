import { Skeleton } from "@/components/Skeleton";

/** Shared loading skeleton for the meeting workspace and its read-only share view. */
export function WorkspaceSkeleton() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-2/3 max-w-md" />
      <div className="mt-4 flex flex-wrap gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-5 h-7 w-40" />

      {/* Player */}
      <Skeleton className="mt-8 h-[4.75rem] w-full" />

      {/* Tabs */}
      <div className="mt-5 flex gap-6 border-b border-border pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>

      {/* Panel body */}
      <div className="mt-6 max-w-reading space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </main>
  );
}
