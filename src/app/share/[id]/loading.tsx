import { Logo } from "@/components/Logo";
import { WorkspaceSkeleton } from "@/components/WorkspaceSkeleton";

/** Shared meeting (read-only) loading skeleton. */
export default function Loading() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
        </div>
      </header>
      <WorkspaceSkeleton />
    </div>
  );
}
