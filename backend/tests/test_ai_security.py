from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.api.v1.endpoints.ai import _gateway_error
from app.services.rate_limiter import RateLimiter


def test_chat_rejects_oversized_message(client) -> None:
    response = client.post(
        "/api/v1/ai/chat",
        json={"messages": [{"role": "user", "content": "x" * 4_001}]},
    )
    assert response.status_code == 422


def test_chat_rejects_too_many_messages(client) -> None:
    response = client.post(
        "/api/v1/ai/chat",
        json={"messages": [{"role": "user", "content": "halo"}] * 21},
    )
    assert response.status_code == 422


def test_chat_rejects_oversized_conversation(client) -> None:
    response = client.post(
        "/api/v1/ai/chat",
        json={
            "messages": [
                {"role": "user", "content": "x" * 4_000},
                {"role": "assistant", "content": "y" * 4_000},
                {"role": "user", "content": "z" * 4_000},
                {"role": "assistant", "content": "a"},
            ]
        },
    )
    assert response.status_code == 422


def test_rate_limiter_rejects_request_over_limit() -> None:
    rate_limiter = RateLimiter()
    rate_limiter.check("client", limit=2)
    rate_limiter.check("client", limit=2)
    with pytest.raises(HTTPException) as exc:
        rate_limiter.check("client", limit=2)
    assert exc.value.status_code == 429
    assert "Retry-After" in (exc.value.headers or {})


def test_unknown_gateway_error_does_not_leak_exception_message() -> None:
    error = _gateway_error(RuntimeError("secret upstream detail"))
    assert error.status_code == 502
    assert "secret" not in error.detail


def test_chat_success_uses_gateway_without_real_network(client) -> None:
    with (
        patch("app.api.v1.endpoints.ai.retrieve_context", return_value=[]),
        patch(
            "app.api.v1.endpoints.ai.chat_completion",
            return_value=("test/model", "Sugeng rawuh"),
        ),
    ):
        response = client.post(
            "/api/v1/ai/chat",
            headers={"x-forwarded-for": "198.51.100.10"},
            json={"messages": [{"role": "user", "content": "Halo"}]},
        )
    assert response.status_code == 200
    assert response.json()["data"] == {
        "model": "test/model",
        "answer": "Sugeng rawuh",
        "sources": [],
    }
