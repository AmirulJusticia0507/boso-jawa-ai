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
