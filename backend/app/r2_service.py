"""Cloudflare R2 (S3-compatible) helpers for direct-to-storage uploads."""
import os
import secrets
from typing import Optional

import boto3
from botocore.client import Config


R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_ENDPOINT = os.getenv("R2_ENDPOINT", "")
R2_BUCKET = os.getenv("R2_BUCKET", "juicypolicy")
R2_PUBLIC_URL_BASE = os.getenv("R2_PUBLIC_URL_BASE", "")  # optional: cdn.juicypolicy.com or pub-xxx.r2.dev


def _client():
    if not (R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY and R2_ENDPOINT):
        raise RuntimeError("R2 credentials not configured")
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4", region_name="auto"),
    )


def make_object_key(agent_id: int, filename: str) -> str:
    """Build a unique r2 object key. Uses a random nonce to avoid collisions."""
    nonce = secrets.token_hex(8)
    safe = "".join(c if c.isalnum() or c in ".-_" else "_" for c in filename)
    return f"agents/{agent_id}/{nonce}-{safe}"


def presign_put(key: str, mime_type: Optional[str], expires_seconds: int = 600) -> str:
    """Return a presigned URL the browser can PUT to. Default 10min expiry."""
    s3 = _client()
    params = {"Bucket": R2_BUCKET, "Key": key}
    if mime_type:
        params["ContentType"] = mime_type
    return s3.generate_presigned_url(
        "put_object",
        Params=params,
        ExpiresIn=expires_seconds,
        HttpMethod="PUT",
    )


def presign_get(key: str, expires_seconds: int = 60 * 60) -> str:
    """Return a presigned URL the browser can GET. Default 1h expiry."""
    s3 = _client()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": R2_BUCKET, "Key": key},
        ExpiresIn=expires_seconds,
        HttpMethod="GET",
    )


def public_url_for(key: str) -> Optional[str]:
    """Return a public URL if a public bucket is configured, else None."""
    if not R2_PUBLIC_URL_BASE:
        return None
    base = R2_PUBLIC_URL_BASE.rstrip("/")
    return f"{base}/{key}"


def delete_object(key: str) -> None:
    s3 = _client()
    s3.delete_object(Bucket=R2_BUCKET, Key=key)
