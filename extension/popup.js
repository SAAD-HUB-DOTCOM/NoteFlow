/** Popup: reflect signed-in state (read from the app session) and offer quick links. */
const dot = document.getElementById("dot");
const statusText = document.getElementById("status-text");

chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
  const signedIn = !chrome.runtime.lastError && state?.signedIn;
  dot.className = `dot ${signedIn ? "ok" : "off"}`;
  statusText.textContent = signedIn ? "Signed in — ready to capture" : "Signed out";

  document.getElementById("open-app").addEventListener("click", () =>
    chrome.runtime.sendMessage({ type: "OPEN_APP", path: "/app/meetings" }),
  );
  document.getElementById("sign-in").addEventListener("click", () =>
    chrome.runtime.sendMessage({ type: "OPEN_APP", path: "/login" }),
  );
});
