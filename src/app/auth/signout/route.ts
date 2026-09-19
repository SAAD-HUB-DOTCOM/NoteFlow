import { NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

/** Sign out and return to the marketing home. */
export async function POST(req: Request) {
  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServer();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
