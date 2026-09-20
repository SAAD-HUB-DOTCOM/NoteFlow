import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { AppHeader } from "@/components/app/AppHeader";
import { AppTabs } from "@/components/app/AppTabs";
import { RealtimeProvider } from "@/components/app/RealtimeProvider";

/**
 * Route guard + chrome for the authenticated app. No Supabase session → /login. Header and tab
 * row are shared across every app page; each page fills the flex-1 content row below them.
 * RealtimeProvider opens ONE meetings channel here so every app page shares a single subscription.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  return (
    <RealtimeProvider>
      <div className="flex min-h-screen flex-col">
        <AppHeader email={user.email ?? null} />
        <AppTabs />
        <div className="mx-auto flex w-full max-w-[1400px] flex-1">{children}</div>
      </div>
    </RealtimeProvider>
  );
}
