from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError
from unittest.mock import MagicMock, patch

from app.main import app


client = TestClient(app)


def test_root_endpoint() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["docs"] == "/docs"


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_liveness_endpoint_includes_request_id() -> None:
    response = client.get("/health/live", headers={"X-Request-ID": "test-request-123"})
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["X-Request-ID"] == "test-request-123"


def test_readiness_checks_database() -> None:
    connection = MagicMock()
    context = MagicMock()
    context.__enter__.return_value = connection
    with patch("app.main.engine.connect", return_value=context):
        response = client.get("/health/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready", "database": "ok"}
    connection.execute.assert_called_once()


def test_readiness_reports_unavailable_database() -> None:
    with patch("app.main.engine.connect", side_effect=SQLAlchemyError("offline")):
        response = client.get("/health/ready")
    assert response.status_code == 503
    assert response.json()["detail"] == "Database belum siap."


def test_transliterate_endpoint() -> None:
    response = client.post(
        "/api/v1/aksara/transliterate",
        json={"text": "mangan", "direction": "latin_to_aksara"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["data"]["aksara"] == "\ua9a9\ua994\ua9a4\ua9c0"
    assert body["data"]["latin"] is None


def test_transliterate_endpoint_validates_empty_input() -> None:
    response = client.post(
        "/api/v1/aksara/transliterate",
        json={"text": "", "direction": "latin_to_aksara"},
    )
    assert response.status_code == 422


def test_kawruh_search_rejects_whitespace_query_before_database_access() -> None:
    response = client.get("/api/v1/kawruh/search", params={"q": "   "})
    assert response.status_code == 422
    assert response.json()["detail"] == "Kata kunci tidak boleh kosong."
