"""Rate limiter untuk endpoint publik.

Penyimpanan dibacks Redis/Upstash bila dikonfigurasi, dan otomatis turun ke
penyimpanan in-memory (fixed window) bila tidak ada Redis maupun saat Redis
tidak bisa dihubungi — supaya endpoint publik tidak ikut mati saat store
temporarily down.
"""

import logging
import time
from abc import ABC, abstractmethod
from collections import defaultdict, deque
from threading import Lock
from typing import Any

from fastapi import HTTPException, Request

from app.core.config import settings

logger = logging.getLogger("boso_jawa.rate_limiter")

TOO_MANY_REQUESTS = "Terlalu banyak permintaan. Coba lagi sebentar."

# Sliding window atomik: hapus entri kedaluwarsa, cek kuota, lalu catat
# request baru — semuanya atomik di sisi Redis.
_SLIDING_WINDOW_LUA = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retry = window
  if oldest[2] then
    retry = math.ceil((tonumber(oldest[2]) + window - now) / 1000)
  end
  if retry < 1 then retry = 1 end
  redis.call('PEXPIRE', key, window)
  return {0, retry}
end
redis.call('ZADD', key, now, now)
redis.call('PEXPIRE', key, window)
return {1, 0}
"""


class RateLimitStore(ABC):
    """Antarmuka penyimpanan penghitung rate limit."""

    name: str = "store"

    @abstractmethod
    def acquire(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        """Kembalikan ``(diizinkan, retry_after_detik)``."""

    @abstractmethod
    def reset(self) -> None:
        """Bersihkan semua state (dipakai test)."""


class MemoryRateLimitStore(RateLimitStore):
    """Fixed window in-process. Cukup untuk dev/test dan sebagai fallback."""

    name = "memory"

    def __init__(self) -> None:
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def acquire(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        now = time.monotonic()
        cutoff = now - window_seconds
        with self._lock:
            entries = self._requests[key]
            while entries and entries[0] <= cutoff:
                entries.popleft()
            if len(entries) >= limit:
                retry_after = max(1, int(window_seconds - (now - entries[0])))
                return False, retry_after
            entries.append(now)
            return True, 0

    def reset(self) -> None:
        with self._lock:
            self._requests.clear()


class RedisRateLimitStore(RateLimitStore):
    """Sliding window di Redis (TCP/TLS, termasuk Upstash)."""

    name = "redis"

    def __init__(self, client: Any) -> None:
        self._redis = client
        self._script: Any = None
        self._lock = Lock()

    @classmethod
    def from_url(cls, url: str) -> "RedisRateLimitStore":
        import redis  # impor lokal: dependency opsional

        client = redis.Redis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=settings.rate_limit_connect_timeout,
            socket_timeout=settings.rate_limit_socket_timeout,
            health_check_interval=30,
        )
        return cls(client)

    def _load_script(self) -> Any:
        with self._lock:
            if self._script is None:
                self._script = self._redis.register_script(_SLIDING_WINDOW_LUA)
            return self._script

    def acquire(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        now_ms = int(time.time() * 1000)
        window_ms = window_seconds * 1000
        allowed, retry_after = self._load_script()(
            keys=[key],
            args=[now_ms, window_ms, limit],
        )
        return bool(allowed), int(retry_after)

    def reset(self) -> None:
        with self._lock:
            self._script = None


class UpstashRestRateLimitStore(RateLimitStore):
    """Sliding window via Upstash REST API (cocok untuk Vercel/serverless)."""

    name = "upstash"

    def __init__(self, rest_url: str, token: str) -> None:
        import httpx

        self._url = f"{rest_url.rstrip('/')}/pipeline"
        self._token = token
        self._client = httpx.Client(
            timeout=settings.rate_limit_socket_timeout,
            headers={"Authorization": f"Bearer {token}"},
        )
        self._script: Any = None

    def _command(self, *args: Any) -> Any:
        response = self._client.post(
            self._url,
            json=[list(args)],
        )
        response.raise_for_status()
        payload = response.json()
        return payload[0]["result"] if payload and payload[0].get("result") is not None else None

    def acquire(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        now_ms = int(time.time() * 1000)
        window_ms = window_seconds * 1000
        if self._script is None:
            self._script = self._command("SCRIPT", "LOAD", _SLIDING_WINDOW_LUA)
        sha = self._script
        result = self._command("EVALSHA", sha, "1", key, now_ms, window_ms, limit)
        if not isinstance(result, list) or len(result) != 2:
            return True, 0
        return bool(int(result[0])), int(result[1])

    def reset(self) -> None:
        self._script = None


class RateLimiter:
    """Rate limiter dengan store utama + fallback in-memory."""

    def __init__(self, store: RateLimitStore | None = None, *, fallback: bool = True) -> None:
        self._store = store or MemoryRateLimitStore()
        self._fallback = MemoryRateLimitStore() if fallback else None

    @property
    def backend(self) -> str:
        return self._store.name

    def check(self, key: str, limit: int, window_seconds: int | None = None) -> None:
        window = window_seconds or settings.rate_limit_window_seconds
        store = self._store
        try:
            allowed, retry_after = store.acquire(key, limit, window)
        except Exception as exc:  # noqa: BLE001 — store failure tidak boleh mematikan API
            logger.warning("rate_limit_store_error", extra={"backend": store.name, "error": str(exc)})
            if self._fallback is None:
                return
            store = self._fallback
            allowed, retry_after = store.acquire(key, limit, window)

        if not allowed:
            raise HTTPException(
                status_code=429,
                detail=TOO_MANY_REQUESTS,
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )

    def reset(self) -> None:
        self._store.reset()
        if self._fallback is not None:
            self._fallback.reset()


def build_store() -> RateLimitStore:
    """Pilih store berdasarkan konfigurasi, dengan degrade yang aman."""
    backend = settings.rate_limit_backend
    if backend == "upstash":
        try:
            store = UpstashRestRateLimitStore(settings.upstash_rest_url, settings.upstash_rest_token)
            logger.info("rate_limit_backend", extra={"backend": "upstash"})
            return store
        except Exception as exc:  # noqa: BLE001
            logger.warning("rate_limit_backend_fallback", extra={"error": str(exc)})
    elif backend == "redis":
        try:
            store = RedisRateLimitStore.from_url(settings.redis_url)
            logger.info("rate_limit_backend", extra={"backend": "redis"})
            return store
        except Exception as exc:  # noqa: BLE001
            logger.warning("rate_limit_backend_fallback", extra={"error": str(exc)})

    if not settings.rate_limit_fallback_memory:
        raise RuntimeError(
            "Rate limit store tidak terkonfigurasi dan fallback memory dinonaktifkan."
        )
    logger.info("rate_limit_backend", extra={"backend": "memory"})
    return MemoryRateLimitStore()


limiter = RateLimiter(build_store(), fallback=settings.rate_limit_fallback_memory)


def client_identifier(request: Request) -> str:
    """Use platform-provided client IP headers, then fall back to the socket IP."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"
