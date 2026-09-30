"""Small in-memory fixed-window limiter for public AI endpoints."""

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self) -> None:
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str, limit: int, window_seconds: int = 60) -> None:
        now = monotonic()
        cutoff = now - window_seconds
        with self._lock:
            entries = self._requests[key]
            while entries and entries[0] <= cutoff:
                entries.popleft()
            if len(entries) >= limit:
                retry_after = max(1, int(window_seconds - (now - entries[0])))
                raise HTTPException(
                    status_code=429,
                    detail="Terlalu banyak permintaan. Coba lagi sebentar.",
                    headers={"Retry-After": str(retry_after)},
                )
            entries.append(now)

    def reset(self) -> None:
        with self._lock:
            self._requests.clear()


limiter = RateLimiter()


def client_identifier(request: Request) -> str:
    """Use platform-provided client IP headers, then fall back to the socket IP."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"
