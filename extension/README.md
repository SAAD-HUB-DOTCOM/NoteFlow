# NoteFlow Meeting Capture — Chrome extension

One-click meeting capture with NoteFlow, **without pasting a link**. It detects when you're on a
Google Meet / Zoom / Microsoft Teams call, shows a floating **Record with NoteFlow** widget, and
fires the *same* backend capture your app already uses (`POST /api/v1/meetings/capture`) — so the
NoteFlow bot joins exactly as before and the meeting appears in **My Meetings** automatically.

The manual "paste a link" flow in the web app is untouched and still works — this is additive.

## How it works

1. `content.js` runs on meeting pages and renders the widget (in a shadow root, so page CSS can't
   interfere). Clicking **Record** sends the current tab URL to the background worker.
2. `content-app.js` runs on the NoteFlow web app and mirrors your Supabase session into extension
   storage (read-only) so the widget can authenticate.
3. `background.js` reads a valid Supabase access token (`auth.js` — from storage, falling back to
   the app's auth cookie, refreshing if expired) and calls `/api/v1/meetings/capture` with
   `Authorization: Bearer <token>` and `{ "meeting_url": "<current tab url>" }`.
4. Recall.ai's bot joins and records — no change to your backend or the rest of the app.

## Configure

`config.js` is prefilled with your **local dev** values (public `NEXT_PUBLIC_*` keys):

- `apiBaseUrl` — `http://localhost:8000`
- `supabaseUrl` / `supabaseAnonKey` — your Supabase project + anon (public) key
- `appUrl` — `http://localhost:3100`

For a **deployed** app, update those in `config.js` **and** the matching entries in
`manifest.json` (`host_permissions` + the `content-app.js` match pattern) to your real domains.

## Load it (dev)

1. Make sure the web app (`:3100`) and the FastAPI backend (`:8000`) are running, and you've
   **signed in** to the app at least once in this Chrome profile.
2. Go to `chrome://extensions`, turn on **Developer mode** (top right).
3. **Load unpacked** → select this `extension/` folder.
4. Open a Google Meet / Zoom / Teams meeting. The NoteFlow widget appears bottom-right → click
   **Record**. Check the app's **My Meetings** — the capture shows up.

## Notes & limits

- **Icons:** none bundled, so Chrome shows a default action icon. Drop `icon16/48/128.png` in and
  add an `"icons"` block to `manifest.json` to brand it.
- **Auth:** the extension reuses the app's Supabase session; if the popup says "Signed out",
  open NoteFlow and sign in once.
- **Not runtime-tested here:** this was authored against your API/auth contract but not loaded in
  a live Chrome against your backend — load it as above and tell me anything that misbehaves
  (most likely spot is the Supabase cookie/session parsing in `auth.js` / `content-app.js`,
  which I can adjust to your exact `@supabase/ssr` version).
- **Meeting detection** (`looksLikeMeeting` in `content.js`) is heuristic per platform; if the
  widget doesn't show on a valid call (or shows on a lobby), tell me the URL and I'll tune it.
