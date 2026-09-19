import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

/** OAuth return: exchange the code for a session (sets cookies), then continue to `next`. */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/meetings";

  if (isSupabaseConfigured && code) {
    const supabase = await getSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
