"""Recall.ai integration: bot creation, webhook signature verification, URL/status helpers.

The exact request/webhook shapes must be confirmed against Recall's live docs at wiring time
(note-flow.md §9/§11). What is locked and unit-tested here is the *logic*: HMAC signature
verification, provider detection, URL validation, and status normalization — all of which we
can prove correct without a live workspace.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
from collections.abc import Mapping
from urllib.parse import urlparse

import httpx


class RecallNotConfigured(RuntimeError):
    """Raised when RECALL_API_KEY is missing — surfaced as a truthful 503, never faked."""


class RecallService:
    def __init__(self, api_key: str, region: str) -> None:
        self.api_key = api_key
        self.region = region
        # Region-scoped base URL, e.g. https://ap-northeast-1.recall.ai/api/v1
        self.base_url = f"https://{region}.recall.ai/api/v1"

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Token {self.api_key}", "Content-Type": "application/json"}

    def create_bot(self, meeting_url: str, bot_name: str = "NoteFlow Notetaker") -> dict:
        """Send a bot to a meeting. Returns Recall's bot object (contains the bot id)."""
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                f"{self.base_url}/bot/",
                json={"meeting_url": meeting_url, "bot_name": bot_name},
                headers=self._headers(),
            )
            resp.raise_for_status()
            return resp.json()

    def create_transcript(self, recording_id: str) -> dict:
        """Start an async AssemblyAI transcript for a recording (Phase 4).

        The AssemblyAI credential lives in the Recall workspace (Tokyo); we only select the
        provider + diarization here. Endpoint:
        POST /recording/{recording_id}/create_transcript/
        """
        body = {
            "provider": {
                "assembly_ai_async": {
                    "speaker_labels": True,  # diarization / speaker identity
                }
            }
        }
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                f"{self.base_url}/recording/{recording_id}/create_transcript/",
                json=body,
                headers=self._headers(),
            )
            resp.raise_for_status()
            return resp.json()

    def get_transcript(self, transcript_id: str) -> dict:
        """Fetch the Recall transcript object (contains data.download_url when ready)."""
        with httpx.Client(timeout=30) as client:
            resp = client.get(
                f"{self.base_url}/transcript/{transcript_id}/", headers=self._headers()
            )
            resp.raise_for_status()
            return resp.json()

    def download_transcript(self, download_url: str):
        """Download the transcript artifact from its (presigned) download URL — no auth header."""
        with httpx.Client(timeout=120, follow_redirects=True) as client:
            resp = client.get(download_url)
            resp.raise_for_status()
            return resp.json()


def get_recall_service(api_key: str | None, region: str) -> RecallService:
    if not api_key:
        raise RecallNotConfigured("RECALL_API_KEY is not configured.")
    return RecallService(api_key, region)


# ── URL / provider ────────────────────────────────────────────────────────────

SUPPORTED_PROVIDERS = {"google_meet", "zoom", "teams"}


def provider_from_url(url: str) -> str | None:
    """Detect the meeting provider from a URL, or None if unsupported."""
    host = (urlparse(url).hostname or "").lower()
    if not host:
        return None
    if host == "meet.google.com" or host.endswith(".meet.google.com"):
        return "google_meet"
    if "zoom.us" in host or "zoom.com" in host:
        return "zoom"
    if "teams.microsoft.com" in host or "teams.live.com" in host:
        return "teams"
    return None


# ── Webhook signature verification (Svix-compatible HMAC-SHA256) ────────────────

def webhook_event_id(headers: Mapping[str, str]) -> str | None:
    """Normalized webhook/event id for idempotency.

    Current Recall workspaces (created after 2025-12-15) send `webhook-id`; older ones sent the
    Svix `svix-id`. Prefer the current header, fall back to the legacy alias.
    """
    lower = {k.lower(): v for k, v in headers.items()}
    return lower.get("webhook-id") or lower.get("svix-id")


def verify_webhook_signature(secret: str, headers: Mapping[str, str], raw_body: bytes) -> bool:
    """Verify a Recall webhook signature per Recall's current docs.

    Recall (Standard Webhooks / Svix format): base64-decode the `whsec_` workspace secret body,
    then HMAC-SHA256 over `{webhook-id}.{webhook-timestamp}.{raw-body}` and compare (constant-time,
    base64) against the signature header. Headers use `webhook-*` on workspaces created after
    2025-12-15, with `svix-*` accepted as legacy aliases. The signature header may carry several
    space-separated `v1,<sig>` entries during secret rotation — any matching one passes. HMAC is
    over the exact RAW request body (never a re-serialized copy).
    """
    lower = {k.lower(): v for k, v in headers.items()}
    msg_id = lower.get("webhook-id") or lower.get("svix-id")
    timestamp = lower.get("webhook-timestamp") or lower.get("svix-timestamp")
    sig_header = lower.get("webhook-signature") or lower.get("svix-signature")
    if not (msg_id and timestamp and sig_header):
        return False

    signed_content = f"{msg_id}.{timestamp}.".encode("utf-8") + raw_body

    key = secret[len("whsec_"):] if secret.startswith("whsec_") else secret
    try:
        secret_bytes = base64.b64decode(key)
    except Exception:
        secret_bytes = key.encode("utf-8")

    expected = base64.b64encode(
        hmac.new(secret_bytes, signed_content, hashlib.sha256).digest()
    ).decode("utf-8")

    # Space-separated list of `<version>,<base64sig>`; accept any matching v1 signature.
    for part in sig_header.split(" "):
        version, _, sig = part.partition(",")
        if version == "v1" and sig and hmac.compare_digest(sig, expected):
            return True
    return False


def sign_webhook(secret: str, msg_id: str, timestamp: str, raw_body: bytes) -> str:
    """Produce a `v1,<sig>` signature over `{id}.{timestamp}.{raw-body}`. Tests + local replay."""
    signed_content = f"{msg_id}.{timestamp}.".encode("utf-8") + raw_body
    key = secret[len("whsec_"):] if secret.startswith("whsec_") else secret
    try:
        secret_bytes = base64.b64decode(key)
    except Exception:
        secret_bytes = key.encode("utf-8")
    digest = hmac.new(secret_bytes, signed_content, hashlib.sha256).digest()
    return "v1," + base64.b64encode(digest).decode("utf-8")


# ── Status normalization ────────────────────────────────────────────────────────
# Map Recall bot status codes to our normalized meeting lifecycle (note-flow.md §6).
# Names are best-effort and must be reconciled with Recall's real event model.
RECALL_BOT_STATUS_MAP: dict[str, str] = {
    "joining_call": "joining",
    "in_waiting_room": "in_waiting_room",
    "in_call_not_recording": "recording",
    "in_call_recording": "recording",
    "recording_permission_allowed": "recording",
    "recording_done": "recording_complete",
    "call_ended": "recording_complete",
    "done": "recording_complete",
    "fatal": "failed",
    "error": "failed",
}


def map_bot_status(code: str) -> str | None:
    return RECALL_BOT_STATUS_MAP.get(code)
