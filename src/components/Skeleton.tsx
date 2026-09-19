/** A neutral shimmer block for loading skeletons (reduced-motion disables the pulse globally). */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-surface ${className}`} aria-hidden="true" />
  );
}
