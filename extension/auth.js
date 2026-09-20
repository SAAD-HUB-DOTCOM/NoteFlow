/**
 * Bridges the web app's Supabase session into the extension so capture calls carry the same JWT
 * the app uses. Two sources, in order of freshness:
 *   1. chrome.storage — mirrored by content-app.js whenever the NoteFlow tab is open.
 *   2. chrome.cookies — the @supabase/ssr auth cookie on the app domain (works even if the app
 *      isn't currently open, as long as the user has signed in there).
 * Access tokens are short-lived, so we refresh with the refresh_token when they're near expiry.
 */
import { CONFIG, PROJECT_REF } from "./config.js";

const COOKIE_BASE = `sb-${PROJECT_REF}-auth-token`;

/** Parse an @supabase/ssr cookie/storage value into a session object. */
export function parseSession(raw) {
  if (!raw) return null;
  let val = raw;
  if (val.startsWith("base64-")) {
    try {
      val = atob(val.slice(7));
    } catch {
      return null;
    }
  }
  let parsed;
  try {
    parsed = JSON.parse(val);
  } catch {
    return null;
  }
  if (Array.isArray(parsed)) {
    // legacy array form: [access_token, refresh_token, ...]
    return { access_token: parsed[0], refresh_token: parsed[1] };
  }
  if (parsed?.access_token) return parsed;
  if (parsed?.currentSession?.access_token) return parsed.currentSession;
  return null;
}

// Diagnostics are rate-limited so the auth re-check (every few seconds) doesn't flood the
// service-worker console and bury real errors.
let lastDiagAt = 0;
function diag(...args) {
  if (Date.now() - lastDiagAt < 60_000) return;
  lastDiagAt = Date.now();
  console.log("[NoteFlow]", ...args);
}

/** Reassemble the (possibly chunked) auth cookie and parse it, across every known app origin. */
async function sessionFromCookies() {
  const origins = CONFIG.appOrigins?.length ? CONFIG.appOrigins : [CONFIG.appUrl];
  const summary = [];
  for (const origin of origins) {
    const all = await chrome.cookies.getAll({ url: origin });
    summary.push(`${origin} → ${all.length ? all.map((c) => c.name).join(", ") : "(no cookies)"}`);
    const chunks = all
      .filter((c) => c.name === COOKIE_BASE || c.name.startsWith(`${COOKIE_BASE}.`))
      .sort((a, b) => chunkIndex(a.name) - chunkIndex(b.name));
    if (!chunks.length) continue;
    const session = parseSession(chunks.map((c) => c.value).join(""));
    if (session?.access_token) return session;
    summary.push(`${origin} → auth cookie present but parse failed`);
  }
  diag("no usable session in cookies.", summary.join(" | "));
  return null;
}

function chunkIndex(name) {
  const dot = name.lastIndexOf(".");
  const suffix = dot >= 0 ? Number(name.slice(dot + 1)) : NaN;
  return Number.isInteger(suffix) ? suffix : 0;
}

/** Exchange a refresh token for a fresh session against Supabase's auth endpoint. */
async function refreshSession(refreshToken) {
  const res = await fetch(
    `${CONFIG.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CONFIG.supabaseAnonKey,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );
  if (!res.ok) throw new AuthError("NOT_SIGNED_IN", "Your NoteFlow session expired — open NoteFlow and sign in again.");
  return res.json();
}

export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/** Return a valid access token, refreshing if needed, or throw AuthError('NOT_SIGNED_IN'). */
export async function getAccessToken() {
  const stored = (await chrome.storage.local.get("nf_session")).nf_session || null;
  let session = stored?.access_token ? stored : await sessionFromCookies();

  if (!session?.access_token) {
    const perms = await chrome.permissions.getAll();
    diag(
      `signed-out state — mirrored session in storage: ${stored ? "present but unusable" : "none"};`,
      `granted origins: ${(perms.origins ?? []).join(", ") || "(none)"}`,
    );
    throw new AuthError("NOT_SIGNED_IN", "Sign in to NoteFlow first.");
  }

  const expMs = (session.expires_at ?? 0) * 1000;
  if (expMs && expMs < Date.now() + 30_000) {
    if (!session.refresh_token) {
      throw new AuthError("NOT_SIGNED_IN", "Your NoteFlow session expired — sign in again.");
    }
    const refreshed = await refreshSession(session.refresh_token);
    session = { ...session, ...refreshed };
    await chrome.storage.local.set({ nf_session: session });
  }
  return session.access_token;
}
