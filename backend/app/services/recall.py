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

def verify_webhook_signature(secret: str, headers: Mapping[str, str], raw_body: bytes) -> bool:
    """Verify a Recall (Svix-delivered) webhook signature.

    Signed content is `{id}.{timestamp}.{body}`, HMAC-SHA256 with the base64-decoded secret
    (the `whsec_` prefix is stripped), compared (constant-time) against the base64 signatures
    in the signature header. Header names accept both `svix-*` and `webhook-*` spellings.
    """
    lower = {k.lower(): v for k, v in headers.items()}
    msg_id = lower.get("svix-id") or lower.get("webhook-id")
    timestamp = lower.get("svix-timestamp") or lower.get("webhook-timestamp")
    sig_header = lower.get("svix-signature") or lower.get("webhook-signature")
    if not (msg_id and timestamp and sig_header):
        return False

    signed_content = f"{msg_id}.{timestamp}.{raw_body.decode('utf-8')}".encode("utf-8")

    key = secret[len("whsec_"):] if secret.startswith("whsec_") else secret
    try:
        secret_bytes = base64.b64decode(key)
    except Exception:
        secret_bytes = key.encode("utf-8")

    expected = base64.b64encode(
        hmac.new(secret_bytes, signed_content, hashlib.sha256).digest()
    ).decode("utf-8")

    # Signature header is a space-separated list of `v1,<base64sig>` entries.
    for part in sig_header.split(" "):
        _, _, sig = part.partition(",")
        if sig and hmac.compare_digest(sig, expected):
            return True
    return False


def sign_webhook(secret: str, msg_id: str, timestamp: str, raw_body: bytes) -> str:
    """Produce a Svix-style `svix-signature` value. Used by tests (and useful for local replay)."""
    signed_content = f"{msg_id}.{timestamp}.{raw_body.decode('utf-8')}".encode("utf-8")
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
