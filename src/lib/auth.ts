import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

/** The authenticated user for the current request, or null. Used by the /app route guard. */
export async function getServerUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
