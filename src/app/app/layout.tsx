import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { AppHeader } from "@/components/app/AppHeader";

/**
 * Route guard for the authenticated app. No Supabase session → /login. When auth isn't
 * configured yet, getServerUser() returns null and this redirects to /login (which shows a
 * truthful "not configured" state) rather than exposing the app.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <AppHeader email={user.email ?? null} />
      {children}
    </div>
  );
}
