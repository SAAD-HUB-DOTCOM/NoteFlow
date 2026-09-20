/**
 * Runs on the NoteFlow web app. When the user is signed in, it mirrors the current Supabase
 * session (access + refresh token) into extension storage so the capture widget on meeting tabs
 * can authenticate even when the app tab isn't focused. Read-only: it never changes the app.
 */
(() => {
  const PROJECT_REF = "nujbrwztoflmvfrcspyg";
  const KEY_BASE = `sb-${PROJECT_REF}-auth-token`;

  function parseSession(raw) {
    if (!raw) return null;
    let val = raw;
    if (val.startsWith("base64-")) {
      try {
        val = atob(val.slice(7));
      } catch {
        return null;
      }
    }
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return { access_token: parsed[0], refresh_token: parsed[1] };
      if (parsed?.access_token) return parsed;
      if (parsed?.currentSession?.access_token) return parsed.currentSession;
    } catch {
      /* not this key */
    }
    return null;
  }

  function fromLocalStorage() {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(KEY_BASE));
      if (!keys.length) return null;
      // single key holds the whole session for the browser client
      return parseSession(localStorage.getItem(keys[0]));
    } catch {
      return null;
    }
  }

  function fromCookies() {
    const map = {};
    for (const part of document.cookie.split(";")) {
      const i = part.indexOf("=");
      if (i < 0) continue;
      map[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1));
    }
    const chunkNames = Object.keys(map)
      .filter((n) => n === KEY_BASE || n.startsWith(`${KEY_BASE}.`))
      .sort((a, b) => {
        const ai = a.includes(".") ? Number(a.split(".").pop()) : 0;
        const bi = b.includes(".") ? Number(b.split(".").pop()) : 0;
        return ai - bi;
      });
    if (!chunkNames.length) return null;
    return parseSession(chunkNames.map((n) => map[n]).join(""));
  }

  let lastLogged = null;
  function mirror() {
    const session = fromLocalStorage() || fromCookies();
    try {
      if (session?.access_token) {
        chrome.storage.local.set({ nf_session: session });
        if (lastLogged !== "ok") {
          lastLogged = "ok";
          console.log("[NoteFlow] signed-in session mirrored to the extension ✓");
        }
      } else if (lastLogged !== "none") {
        lastLogged = "none";
        const lsKeys = Object.keys(localStorage).filter((k) => k.startsWith("sb-"));
        console.log(
          "[NoteFlow] no session found on this page yet.",
          "sb-* localStorage keys:", lsKeys.length ? lsKeys : "(none)",
          "| document.cookie has sb-*:", document.cookie.includes("sb-"),
        );
      }
    } catch {
      /* extension was reloaded — this orphaned copy can no longer write storage */
    }
  }

  mirror();
  window.addEventListener("focus", mirror);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) mirror();
  });
  // Catch sign-in that completes after load (OAuth redirect back, etc.).
  setTimeout(mirror, 3000);
  setInterval(mirror, 5000);
})();
