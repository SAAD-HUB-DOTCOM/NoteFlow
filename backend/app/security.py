"""Supabase JWT verification.

The user identity always comes from the verified token, never from the request body
(note-flow.md §8). Supabase access tokens are HS256-signed with the project JWT secret.
(Asymmetric RS256/JWKS verification is a north-star upgrade.)
"""
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings

bearer = HTTPBearer(auto_error=True)


@dataclass
class CurrentUser:
    id: str
    email: str | None


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if not settings.supabase_jwt_secret:
        # Truthful "not configured" — never fake an authenticated session.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth is not configured (SUPABASE_JWT_SECRET missing).",
        )
    try:
        claims = jwt.decode(
            creds.credentials,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience=settings.supabase_jwt_audience,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        ) from exc

    sub = claims.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject.")
    return CurrentUser(id=sub, email=claims.get("email"))
