"""
Authentication helpers: password hashing, JWT creation/verification.
Uses argon2 (preferred) with bcrypt fallback to avoid bcrypt 72-byte limit.
"""
from __future__ import annotations

import hashlib
import base64
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from backend.config.settings import get_settings


def _prehash(password: str) -> str:
    """SHA-256 pre-hash → 44-char base64 — always < 72 bytes for bcrypt."""
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest).decode("ascii")


# Try argon2 first (no 72-byte limit), fall back to bcrypt with prehash
try:
    from argon2 import PasswordHasher as _Argon2PH
    _ph = _Argon2PH()

    def hash_password(password: str) -> str:
        return _ph.hash(password)

    def verify_password(plain: str, hashed: str) -> bool:
        try:
            return _ph.verify(hashed, plain)
        except Exception:
            return False

except ImportError:
    # Fallback: passlib bcrypt with SHA-256 prehash
    from passlib.context import CryptContext
    _ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def hash_password(password: str) -> str:  # type: ignore[misc]
        return _ctx.hash(_prehash(password))

    def verify_password(plain: str, hashed: str) -> bool:  # type: ignore[misc]
        return _ctx.verify(_prehash(plain), hashed)


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> str:
    """Return user_id or raise JWTError."""
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    sub = payload.get("sub")
    if sub is None:
        raise JWTError("No sub in token")
    return sub
