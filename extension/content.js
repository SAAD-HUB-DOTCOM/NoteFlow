/**
 * In-meeting widget. On Google Meet / Zoom / Teams it drops a small floating "Record with
 * NoteFlow" control (isolated in a shadow root so the host page's CSS can't touch it). One click
 * sends the current tab URL to the background worker, which fires the same capture the app does.
 * No link pasting. The manual paste flow in the app is untouched and still works.
 */
(() => {
  if (window.__noteflowWidgetMounted) return;
  window.__noteflowWidgetMounted = true;

  const host = document.createElement("div");
  host.id = "noteflow-capture-widget";
  host.style.cssText = "position:fixed;z-index:2147483647;right:20px;bottom:20px;";
  const root = host.attachShadow({ mode: "open" });
  document.documentElement.appendChild(host);

  root.innerHTML = `
    <style>
      :host { all: initial; }
      .card {
        position: relative;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        display: flex; align-items: center; gap: 12px;
        background: #0B0B0C; color: #F4F4F2;
        border: 1px solid rgba(255,255,255,0.10); border-radius: 14px;
        padding: 11px 13px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 16px 40px rgba(0,0,0,.55);
        max-width: 320px;
      }
      .mark { flex: 0 0 auto; }
      .body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .title { font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }
      .sub { font-size: 11.5px; color: #A5A5A2; line-height: 1.35; }
      .btn {
        flex: 0 0 auto; cursor: pointer; border: 0; border-radius: 10px;
        background: #F2F2EF; color: #0A0A0A; font-weight: 560; font-size: 12.5px;
        padding: 8px 13px; transition: transform .15s ease, opacity .15s ease;
        font-family: inherit;
      }
      .btn:hover { transform: translateY(-1px); }
      .btn:disabled { opacity: .55; cursor: default; transform: none; }
      .btn.ghost { background: rgba(255,255,255,0.04); color: #EAEAE7; border: 1px solid rgba(255,255,255,0.11); font-weight: 500; }
      .btn.ghost:hover { background: rgba(255,255,255,0.07); transform: none; }
      .dot { width: 7px; height: 7px; border-radius: 50%; background: #E9E9E5; display:inline-block; margin-right:6px; }
      .rec { width: 7px; height: 7px; border-radius: 50%; background: #D96C64; display:inline-block; margin-right:6px; animation: pulse 1.4s ease-in-out infinite; }
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
      .row { display:flex; align-items:center; gap:8px; }
      .close { position:absolute; top:-8px; right:-8px; width:20px; height:20px; border-radius:50%;
        background:#171718; border:1px solid rgba(255,255,255,0.12); color:#A5A5A2; cursor:pointer; font-size:12px; line-height:1;
        display:grid; place-items:center; }
      .hidden { display:none; }
      a { color:#F4F4F2; text-decoration:underline; text-underline-offset:2px; }
      a:hover { text-decoration:underline; }
      @media (prefers-reduced-motion: reduce) { .btn:hover { transform: none; } .rec { animation: none; } }
    </style>
    <div class="card" part="card">
      <button class="close" title="Hide">×</button>
      <span class="mark">
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="27" height="27" rx="8" fill="#101011" stroke="rgba(255,255,255,0.10)"/>
          <g fill="#F4F4F2">
            <rect x="7" y="14" width="2.2" height="6" rx="1.1" opacity="0.55"/>
            <rect x="10.4" y="11" width="2.2" height="12" rx="1.1" opacity="0.8"/>
            <rect x="13.8" y="7.5" width="2.2" height="15" rx="1.1"/>
            <rect x="17.2" y="10.5" width="2.2" height="9" rx="1.1" opacity="0.8"/>
            <rect x="20.6" y="13" width="2.2" height="4.5" rx="1.1" opacity="0.55"/>
          </g>
        </svg>
      </span>
      <div class="body">
        <div class="title">NoteFlow</div>
        <div class="sub" id="nf-sub">Record this meeting — no link to paste.</div>
      </div>
      <button class="btn" id="nf-action">Record</button>
    </div>
  `;

  const card = root.querySelector(".card");
  const sub = root.querySelector("#nf-sub");
  const action = root.querySelector("#nf-action");
  const closeBtn = root.querySelector(".close");

  let dismissed = false;
  closeBtn.addEventListener("click", () => {
    dismissed = true;
    host.style.display = "none";
  });

  // When the extension is reloaded/updated, this injected copy is orphaned: every
  // chrome.runtime call throws "Extension context invalidated". Detect it once, stop the
  // timers, and turn the widget into a "reload this page" prompt instead of erroring forever.
  let dead = false;
  let authTimer = null;
  let syncTimer = null;

  function orphan() {
    if (dead) return;
    dead = true;
    if (authTimer) clearInterval(authTimer);
    if (syncTimer) clearInterval(syncTimer);
    host.style.display = "block";
    sub.textContent = "NoteFlow was updated — reload this page to record.";
    action.textContent = "Reload";
    action.disabled = false;
    action.className = "btn";
    action.onclick = () => location.reload();
  }

  /** Safe wrapper around chrome.runtime.sendMessage that survives extension reloads. */
  function send(msg, cb) {
    if (dead) return;
    try {
      chrome.runtime.sendMessage(msg, (res) => {
        if (chrome.runtime.lastError) {
          cb?.(null);
          return;
        }
        cb?.(res);
      });
    } catch {
      orphan();
    }
  }

  let current = "idle";

  function setState(state, opts = {}) {
    current = state;
    switch (state) {
      case "idle":
        sub.textContent = "Record this meeting — no link to paste.";
        action.textContent = "Record";
        action.disabled = false;
        action.className = "btn";
        action.onclick = start;
        break;
      case "starting":
        sub.textContent = "Sending the NoteFlow notetaker…";
        action.textContent = "Starting…";
        action.disabled = true;
        break;
      case "recording":
        sub.innerHTML = `<span class="rec"></span>NoteFlow is joining and will record this call.`;
        action.textContent = "In My Meetings";
        action.disabled = false;
        action.className = "btn ghost";
        action.onclick = () => send({ type: "OPEN_APP", path: "/app/meetings" });
        break;
      case "signin":
        sub.textContent = "Sign in to NoteFlow to record.";
        action.textContent = "Sign in";
        action.disabled = false;
        action.className = "btn";
        action.onclick = () => send({ type: "OPEN_APP", path: "/login" });
        break;
      case "error":
        sub.textContent = opts.message || "Couldn't start capture. Try again.";
        action.textContent = "Retry";
        action.disabled = false;
        action.className = "btn";
        action.onclick = start;
        break;
    }
  }

  /**
   * Send only a clean, joinable meeting URL — never a lobby, landing, or app-redirect page
   * (e.g. meet.app.goo.gl). Meet URLs are stripped to the bare code (query params like
   * ?authuser=0 confuse the bot); Zoom/Teams keep their full URL since it carries the passcode.
   */
  function joinableUrl() {
    const { hostname, pathname } = location;
    if (hostname === "meet.google.com") {
      const m = pathname.match(/^\/([a-z]{3}-[a-z]{4}-[a-z]{3})(?:\/|$)/i);
      return m ? `https://meet.google.com/${m[1].toLowerCase()}` : null;
    }
    if (hostname.endsWith("zoom.us")) {
      return /\/(j|wc|s)\//.test(pathname) ? location.href : null;
    }
    if (hostname.includes("teams.")) {
      return /meet|conv|calling|\/l\/meetup/i.test(location.href) ? location.href : null;
    }
    return null;
  }

  function start() {
    const url = joinableUrl();
    if (!url) {
      setState("error", {
        message: "This page isn't a joinable meeting. Open the meeting itself, then record.",
      });
      return;
    }
    setState("starting");
    send({ type: "CAPTURE", url }, (res) => {
      if (!res) {
        setState("error", { message: "Extension error. Reload the page." });
        return;
      }
      if (res.ok) {
        setState("recording");
      } else if (res.code === "NOT_SIGNED_IN") {
        setState("signin");
      } else {
        setState("error", { message: res.error });
      }
    });
  }

  setState("idle");

  // Re-check auth so the widget recovers on its own: after the user signs in (in another tab) and
  // returns here, it flips out of the "signin" state back to "Record" without a manual click.
  function refreshAuth() {
    send({ type: "GET_STATE" }, (state) => {
      if (state?.signedIn && current === "signin") setState("idle");
    });
  }
  refreshAuth();
  window.addEventListener("focus", refreshAuth);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshAuth();
  });
  authTimer = setInterval(refreshAuth, 4000);

  // Show the widget only when the tab actually looks like a live meeting, and keep it in sync as
  // these single-page apps navigate between the lobby and the call.
  function looksLikeMeeting() {
    const { host: h, pathname } = location;
    if (h.endsWith("meet.google.com")) return /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\/|$)/i.test(pathname);
    if (h.endsWith("zoom.us")) return /\/(j|wc|s)\//.test(pathname);
    if (h.includes("teams.")) return /meet|conv|calling|\/l\/meetup/i.test(location.href);
    return false;
  }

  function sync() {
    if (dismissed) return;
    host.style.display = looksLikeMeeting() ? "block" : "none";
  }
  sync();
  syncTimer = setInterval(sync, 1500);
})();
