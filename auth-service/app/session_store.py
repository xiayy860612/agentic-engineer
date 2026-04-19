from __future__ import annotations

import secrets
import threading
import time
from dataclasses import dataclass


@dataclass
class _SessionRecord:
    user_id: int
    username: str
    expires_at: float


class InMemorySessionStore:
    """Process-local opaque session store (stage A)."""

    def __init__(self, ttl_seconds: int) -> None:
        self._ttl = ttl_seconds
        self._by_token: dict[str, _SessionRecord] = {}
        self._lock = threading.Lock()

    def create(self, user_id: int, username: str) -> str:
        token = secrets.token_urlsafe(32)
        now = time.monotonic()
        record = _SessionRecord(
            user_id=user_id,
            username=username,
            expires_at=now + float(self._ttl),
        )
        with self._lock:
            self._by_token[token] = record
        return token

    def get(self, token: str | None) -> _SessionRecord | None:
        if not token:
            return None
        now = time.monotonic()
        with self._lock:
            rec = self._by_token.get(token)
            if rec is None:
                return None
            if now > rec.expires_at:
                del self._by_token[token]
                return None
            return rec

    def delete(self, token: str | None) -> None:
        if not token:
            return
        with self._lock:
            self._by_token.pop(token, None)
