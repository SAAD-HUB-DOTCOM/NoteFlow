"""Supabase JWT verification.

The user identity always comes from the verified token, never the request body (note-flow.md §8).

Supabase projects created after the Signing Keys rollout issue **asymmetric** access tokens
(ES256/RS256), verified against the project JWKS at:
    {SUPABASE_URL}/auth/v1/.well-known/jwks.json
using the token's `kid`. Legacy HS256 (shared `SUPABASE_JWT_SECRET`) is kept as a fallback for
older projects. Signature, expiry, issuer, and audience are all validated; unsigned claims are
never trusted. JWKS keys are cached (one client per URL) rather than fetched per request.
"""
from dataclasses import dataclass
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError

from app.config import Settings, get_settings

bearer = HTTPBearer(auto_error=True)

ASYMMETRIC_ALGS = ["RS256", "ES256"]


@dataclass
class CurrentUser:
    id: str
    email: str | None


@lru_cache(maxsize=8)
def _jwk_client(jwks_url: str) -> PyJWKClient:
    # PyJWKClient caches fetched keys (lifespan) — one client reused per URL avoids per-request fetches.
    return PyJWKClient(jwks_url, cache_keys=True, lifespan=600)


def _issuer(settings: Settings) -> str | None:
    return f"{settings.supabase_url}/auth/v1" if settings.supabase_url else None


def _jwks_url(settings: Settings) -> str:
    return f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"


def _not_configured() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Auth is not configured.",
    )


def _unauthorized(detail: str = "Invalid or expired token.") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    token = creds.credentials
    if not (settings.supabase_url or settings.supabase_jwt_secret):
        raise _not_configured()

    try:
        header = jwt.get_unverified_header(token)
    except InvalidTokenError as exc:
        raise _unauthorized() from exc
    alg = header.get("alg", "")

    audience = settings.supabase_jwt_audience
    issuer = _issuer(settings)

    try:
        if alg in ASYMMETRIC_ALGS:
            if not settings.supabase_url:
                raise _not_configured()  # JWKS needs the project URL
            signing_key = _jwk_client(_jwks_url(settings)).get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=ASYMMETRIC_ALGS,  # fixed allowlist — never trust header alg for the family
                audience=audience,
                issuer=issuer,
                options={"require": ["exp"]},
            )
        elif alg == "HS256":
            if not settings.supabase_jwt_secret:
                raise _not_configured()
            decode_kwargs = {
                "algorithms": ["HS256"],
                "audience": audience,
                "options": {"require": ["exp"]},
            }
            if issuer:
                decode_kwargs["issuer"] = issuer
            claims = jwt.decode(token, settings.supabase_jwt_secret, **decode_kwargs)
        else:
            raise _unauthorized("Unsupported token algorithm.")
    except PyJWKClientError as exc:
        # Unknown kid, or JWKS fetch/parse failure — can't verify, so reject.
        raise _unauthorized("Token key not recognized.") from exc
    except InvalidTokenError as exc:
        raise _unauthorized() from exc

    sub = claims.get("sub")
    if not sub:
        raise _unauthorized("Token missing subject.")
    return CurrentUser(id=sub, email=claims.get("email"))
