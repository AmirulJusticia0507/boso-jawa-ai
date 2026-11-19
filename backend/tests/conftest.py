import os

# Set secret sebelum `app.main` di-import. tests/test_admin.py sengaja
# mengetes kondisi secret kosong lewat monkeypatch pada objek settings,
# tetapi test lain butuh secret yang valid untuk membuat captcha/token.
os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-not-for-production")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.rate_limiter import limiter


@pytest.fixture
def client() -> TestClient:
    limiter.reset()
    with TestClient(app) as test_client:
        yield test_client
    limiter.reset()
