import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { fullDisplayName } from "@/lib/user";
import { RealtimeProvider } from "@/components/app/RealtimeProvider";
import { AppShell } from "@/components/app/shell/AppShell";

/**
 * Route guard + chrome for the authenticated app. No Supabase session → /login.
 * RealtimeProvider opens ONE meetings channel here so every app page shares a single
 * subscription; AppShell paints the persistent sidebar + top bar (REDESIGN.md §3–§4).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  return (
    <RealtimeProvider>
      <AppShell name={fullDisplayName(user)} email={user.email ?? null}>
        {children}
      </AppShell>
    </RealtimeProvider>
  );
}
