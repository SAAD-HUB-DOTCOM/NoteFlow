/**
 * Service worker: turns a "record this meeting" click from the in-page widget into the same
 * capture call the web app makes — POST /api/v1/meetings/capture with the Supabase JWT. The bot
 * (Recall.ai) then joins exactly as it does today, and the meeting shows up in My Meetings via
 * the app's realtime channel. The extension changes nothing downstream.
 */
import { CONFIG } from "./config.js";
import { getAccessToken, AuthError } from "./auth.js";

async function captureMeeting(meetingUrl) {
  console.log("[NoteFlow] capture requested:", meetingUrl);
  const token = await getAccessToken();
  const res = await fetch(`${CONFIG.apiBaseUrl}/api/v1/meetings/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ meeting_url: meetingUrl }),
  });

  if (!res.ok) {
    let detail = `Couldn't start capture (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* non-JSON error */
    }
    console.error("[NoteFlow] capture failed:", res.status, detail);
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  const meeting = await res.json();
  console.log("[NoteFlow] capture started:", meeting.id, meeting.status);
  return meeting;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "CAPTURE") {
    captureMeeting(msg.url)
      .then((meeting) => sendResponse({ ok: true, meeting }))
      .catch((err) =>
        sendResponse({
          ok: false,
          code: err instanceof AuthError ? err.code : undefined,
          error: err.message,
        }),
      );
    return true; // async response
  }

  if (msg?.type === "GET_STATE") {
    getAccessToken()
      .then(() => sendResponse({ signedIn: true, appUrl: CONFIG.appUrl, apiBaseUrl: CONFIG.apiBaseUrl }))
      .catch(() => sendResponse({ signedIn: false, appUrl: CONFIG.appUrl, apiBaseUrl: CONFIG.apiBaseUrl }));
    return true;
  }

  if (msg?.type === "OPEN_APP") {
    chrome.tabs.create({ url: msg.path ? `${CONFIG.appUrl}${msg.path}` : CONFIG.appUrl });
    sendResponse({ ok: true });
    return false;
  }
});
