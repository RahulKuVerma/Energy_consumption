import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict, Optional

from fastapi import Depends, Header, HTTPException

from backend.app.core.config import settings
from backend.app.core.database import get_db_connection


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return f"{base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_text, digest_text = stored_hash.split("$", 1)
        salt = base64.urlsafe_b64decode(salt_text.encode())
        expected = base64.urlsafe_b64decode(digest_text.encode())
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_access_token(user: Dict[str, Any]) -> str:
    payload = {
        "sub": user["id"],
        "username": user["username"],
        "role": user["role"],
        "exp": int(time.time()) + 60 * 60 * 12,
    }
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(settings.SECRET_KEY.encode(), encoded.encode(), hashlib.sha256).digest()
    return f"{encoded}.{base64.urlsafe_b64encode(signature).decode().rstrip('=')}"


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        encoded, signature_text = authorization[7:].split(".", 1)
        expected = hmac.new(settings.SECRET_KEY.encode(), encoded.encode(), hashlib.sha256).digest()
        supplied = base64.urlsafe_b64decode((signature_text + "=" * (-len(signature_text) % 4)).encode())
        if not hmac.compare_digest(expected, supplied):
            raise ValueError("invalid signature")
        payload = json.loads(base64.urlsafe_b64decode((encoded + "=" * (-len(encoded) % 4)).encode()))
        if payload["exp"] < time.time():
            raise ValueError("expired token")
        with get_db_connection() as conn:
            user = conn.execute(
                "SELECT id, username, role FROM users WHERE id = ?",
                (payload["sub"],),
            ).fetchone()
        if not user:
            raise ValueError("unknown user")
        return dict(user)
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user