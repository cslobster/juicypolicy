"""Password hashing + HMAC token helpers for agent auth."""
import hashlib
import hmac
import os
import secrets
import time
from typing import Optional

from fastapi import HTTPException, Header
from sqlalchemy.orm import Session

from . import models


PBKDF2_ITERS = 200_000
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days

# Usernames that collide with frontend routes; agents can't claim these.
RESERVED_USERNAMES = {
    "login", "agents", "about", "quote", "api", "admin",
    "logout", "register", "signup", "signin", "auth",
    "static", "assets", "_next", "favicon",
}

USERNAME_PATTERN = "^[a-zA-Z0-9_-]{3,40}$"

SECRET_KEY = os.getenv("SECRET_KEY", "")


def hash_password(password: str, salt: Optional[bytes] = None) -> tuple[bytes, bytes]:
    """Hash password with PBKDF2-HMAC-SHA256. Returns (hash, salt)."""
    if salt is None:
        salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERS)
    return digest, salt


def verify_password(password: str, salt: bytes, expected: bytes) -> bool:
    digest, _ = hash_password(password, salt)
    return hmac.compare_digest(digest, expected)


def issue_token(agent_id: int) -> str:
    """Returns 'agent_id.expires_at.hex_signature'."""
    if not SECRET_KEY:
        raise RuntimeError("SECRET_KEY is not set")
    expires_at = int(time.time()) + TOKEN_TTL_SECONDS
    payload = f"{agent_id}.{expires_at}"
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def verify_token(token: str) -> Optional[int]:
    """Returns agent_id if valid, else None."""
    if not SECRET_KEY or not token:
        return None
    try:
        agent_id_s, expires_s, sig = token.split(".")
        agent_id = int(agent_id_s)
        expires_at = int(expires_s)
    except (ValueError, AttributeError):
        return None
    if expires_at < int(time.time()):
        return None
    payload = f"{agent_id}.{expires_at}"
    expected_sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_sig, sig):
        return None
    return agent_id


def require_agent(authorization: Optional[str] = Header(None)):
    """FastAPI dependency: parses 'Bearer <token>', returns agent_id or 401."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing agent token")
    token = authorization.split(" ", 1)[1]
    agent_id = verify_token(token)
    if agent_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return agent_id


def get_current_agent(db: Session, agent_id: int) -> models.Agent:
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if agent is None:
        raise HTTPException(status_code=401, detail="Agent not found")
    return agent
