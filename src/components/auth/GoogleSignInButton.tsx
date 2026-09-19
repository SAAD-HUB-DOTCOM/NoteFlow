"use client";

import { useState } from "react";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * "Continue with Google" — the single entry to NoteFlow account auth (Supabase → Google).
 * Drop-in for the login page and the marketing CTA. Truthful state when auth isn't configured
 * (no faked flow). `next` is where the user lands after the OAuth round-trip.
 */
export function GoogleSignInButton({
  label = "Continue with Google",
  next = "/app/meetings",
  className,
}: {
  label?: string;
  next?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    if (!isSupabaseConfigured) {
      setError("Sign-in isn’t configured yet.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
      // Browser redirects to Google on success.
    } catch {
      setError("Couldn’t start sign-in. Try again.");
      setLoading(false);
    }
  }

  const base =
    "inline-flex items-center justify-center gap-3 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={signIn}
        disabled={loading || !isSupabaseConfigured}
        title={!isSupabaseConfigured ? "Auth is not configured yet" : undefined}
        className={className ?? base}
      >
        <GoogleGlyph />
        {loading ? "Redirecting…" : label}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#FFC107" d="M17.6 9.2c0-.6-.05-1.2-.16-1.7H9v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5Z" />
      <path fill="#FF3D00" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.8v2.3A9 9 0 0 0 9 18Z" transform="translate(0 0)" />
      <path fill="#4CAF50" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.8a9 9 0 0 0 0 8l3.1-2.3Z" />
      <path fill="#1976D2" d="M9 3.6c1.3 0 2.5.45 3.4 1.3l2.6-2.6A9 9 0 0 0 .8 5l3.1 2.3C4.6 5.2 6.6 3.6 9 3.6Z" />
    </svg>
  );
}
