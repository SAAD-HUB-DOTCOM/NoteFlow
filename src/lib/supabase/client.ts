"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when Supabase env is present — lets the UI show a truthful "not configured" state. */
export const isSupabaseConfigured = Boolean(url && anon);

/** Browser Supabase client. Call inside handlers/effects, not at module load. */
export function getSupabaseBrowser() {
  if (!url || !anon) {
    throw new Error(
      "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  return createBrowserClient(url, anon);
}
