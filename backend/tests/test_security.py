"""JWT verification tests — asymmetric JWKS path (ES256) + legacy HS256, no network."""
import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jwt.exceptions import PyJWKClientError

import app.security as security
from app.config import Settings
from app.security import CurrentUser, get_current_user

ISSUER_ROOT = "https://demo.supabase.co"
AUD = "authenticated"


def _settings(**over):
    base = dict(supabase_url=ISSUER_ROOT, supabase_jwt_audience=AUD)
    base.update(over)
    return Settings(**base)


def _creds(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def _mint_es256(private_key, *, kid="kid-1", sub="user-abc", aud=AUD,
                iss=f"{ISSUER_ROOT}/auth/v1", exp_delta=300, email="a@b.com"):
    return jwt.encode(
        {"sub": sub, "email": email, "aud": aud, "iss": iss, "exp": int(time.time()) + exp_delta},
        private_key,
        algorithm="ES256",
        headers={"kid": kid},
    )


class _FakeSigningKey:
    def __init__(self, key):
        self.key = key


class _FakeJWKClient:
    def __init__(self, public_key):
        self._public_key = public_key

    def get_signing_key_from_jwt(self, token):
        return _FakeSigningKey(self._public_key)


class _UnknownKidClient:
    def get_signing_key_from_jwt(self, token):
        raise PyJWKClientError("no matching kid")


def _patch_jwks(monkeypatch, public_key):
    monkeypatch.setattr(security, "_jwk_client", lambda url: _FakeJWKClient(public_key))


def test_valid_jwks_token(monkeypatch):
    priv = ec.generate_private_key(ec.SECP256R1())
    _patch_jwks(monkeypatch, priv.public_key())
    user = get_current_user(_creds(_mint_es256(priv, sub="user-123")), _settings())
    assert isinstance(user, CurrentUser)
    assert user.id == "user-123"
    assert user.email == "a@b.com"


def test_invalid_signature(monkeypatch):
    priv = ec.generate_private_key(ec.SECP256R1())
    other = ec.generate_private_key(ec.SECP256R1())
    _patch_jwks(monkeypatch, priv.public_key())  # verify against a different key than signed with
    with pytest.raises(HTTPException) as exc:
        get_current_user(_creds(_mint_es256(other)), _settings())
    assert exc.value.status_code == 401


def test_expired_token(monkeypatch):
    priv = ec.generate_private_key(ec.SECP256R1())
    _patch_jwks(monkeypatch, priv.public_key())
    with pytest.raises(HTTPException) as exc:
        get_current_user(_creds(_mint_es256(priv, exp_delta=-30)), _settings())
    assert exc.value.status_code == 401


def test_wrong_audience(monkeypatch):
    priv = ec.generate_private_key(ec.SECP256R1())
    _patch_jwks(monkeypatch, priv.public_key())
    with pytest.raises(HTTPException) as exc:
        get_current_user(_creds(_mint_es256(priv, aud="different-aud")), _settings())
    assert exc.value.status_code == 401


def test_wrong_issuer(monkeypatch):
    priv = ec.generate_private_key(ec.SECP256R1())
    _patch_jwks(monkeypatch, priv.public_key())
    with pytest.raises(HTTPException) as exc:
        get_current_user(_creds(_mint_es256(priv, iss="https://evil.example/auth/v1")), _settings())
    assert exc.value.status_code == 401


def test_unknown_kid(monkeypatch):
    priv = ec.generate_private_key(ec.SECP256R1())
    monkeypatch.setattr(security, "_jwk_client", lambda url: _UnknownKidClient())
    with pytest.raises(HTTPException) as exc:
        get_current_user(_creds(_mint_es256(priv)), _settings())
    assert exc.value.status_code == 401


def test_not_configured():
    priv = ec.generate_private_key(ec.SECP256R1())
    with pytest.raises(HTTPException) as exc:
        get_current_user(
            _creds(_mint_es256(priv)),
            Settings(supabase_url=None, supabase_jwt_secret=None),
        )
    assert exc.value.status_code == 503


def test_legacy_hs256_still_supported():
    secret = "legacy-shared-secret"
    token = jwt.encode(
        {"sub": "u1", "email": "x@y.z", "aud": AUD, "iss": f"{ISSUER_ROOT}/auth/v1",
         "exp": int(time.time()) + 300},
        secret,
        algorithm="HS256",
    )
    user = get_current_user(_creds(token), _settings(supabase_jwt_secret=secret))
    assert user.id == "u1"
