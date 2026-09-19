import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

/** Server Supabase client bound to the request cookies (RSC / route handlers). */
export async function getSupabaseServer() {
  const cookieStore = await cookies();
  type CookieToSet = { name: string; value: string; options?: object };
  return createServerClient(url!, anon!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list: CookieToSet[]) => {
        // Setting cookies from a Server Component throws; that's fine — refresh happens in
        // route handlers/actions. Swallow here so RSC reads don't crash.
        try {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
          );
        } catch {
          /* no-op in RSC context */
        }
      },
    },
  });
}
