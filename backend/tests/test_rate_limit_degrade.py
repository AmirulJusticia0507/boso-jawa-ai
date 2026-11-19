"""Perilaku rate limiter saat store utama gagal."""

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.services.rate_limiter import MemoryRateLimitStore, RateLimiter


class BrokenStore:
    name = "redis"

    def acquire(self, key: str, limit: int, window_seconds: int):
        raise ConnectionError("redis down")

    def reset(self) -> None:
        pass


def test_policy_memory_memakai_fallback(monkeypatch) -> None:
    monkeypatch.setattr(settings, "rate_limit_degrade_policy", "memory")
    limiter = RateLimiter(BrokenStore(), fallback=True)
    # Tiga request pertama diizinkan oleh fallback in-process
    for _ in range(3):
        limiter.check("ip:1", limit=3, window_seconds=60)
    # Keempat ditolak
    with pytest.raises(HTTPException) as exc:
        limiter.check("ip:1", limit=3, window_seconds=60)
    assert exc.value.status_code == 429


def test_policy_reject_menolak_saat_store_gagal(monkeypatch) -> None:
    monkeypatch.setattr(settings, "rate_limit_degrade_policy", "reject")
    limiter = RateLimiter(BrokenStore(), fallback=True)
    with pytest.raises(HTTPException) as exc:
        limiter.check("ip:2", limit=10, window_seconds=60)
    assert exc.value.status_code == 503
    assert exc.value.headers["Retry-After"] == "30"


def test_store_sehat_tidak_terpengaruh_policy(monkeypatch) -> None:
    monkeypatch.setattr(settings, "rate_limit_degrade_policy", "reject")
    limiter = RateLimiter(MemoryRateLimitStore(), fallback=True)
    limiter.check("ip:3", limit=1, window_seconds=60)
    with pytest.raises(HTTPException) as exc:
        limiter.check("ip:3", limit=1, window_seconds=60)
    assert exc.value.status_code == 429
