/**
 * Public client configuration for the NoteFlow capture extension.
 *
 * These are the same NEXT_PUBLIC_* values the web app ships to the browser — the Supabase URL,
 * the *anon* (public) key, and the API base URL — so they are safe to include in the extension.
 * They are prefilled with the local dev values; change them (and the matching host_permissions +
 * content_scripts entries in manifest.json) when you point the extension at a deployed app.
 */
export const CONFIG = {
  // FastAPI backend base (NEXT_PUBLIC_API_BASE_URL) — live Railway deployment.
  apiBaseUrl: "https://noteflow-production-644c.up.railway.app",
  // Supabase project URL (NEXT_PUBLIC_SUPABASE_URL)
  supabaseUrl: "https://nujbrwztoflmvfrcspyg.supabase.co",
  // Supabase anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY) — public by design
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51amJyd3p0b2ZsbXZmcmNzcHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM3OTgsImV4cCI6MjEwNTQwOTc5OH0.X6tIzHCfqzcfPAdYYscgqZkW-SUVcb9QTXBXdQiZpjk",
  // Where sign-in opens (your primary app origin) — the live Vercel app.
  appUrl: "https://noteflow--ai.vercel.app",
  // Every origin where the app might be signed in — the extension looks for the Supabase session
  // cookie across all of these (the deployed app first, then local dev). The old
  // note-flow-eight-blue domain now 307s to noteflow--ai, so its cookies are irrelevant.
  appOrigins: [
    "https://noteflow--ai.vercel.app",
    "http://localhost:3000",
    "http://localhost:3100",
  ],
};

/** Supabase project ref, derived from the URL (used for the auth cookie/storage key name). */
export const PROJECT_REF = new URL(CONFIG.supabaseUrl).hostname.split(".")[0];
