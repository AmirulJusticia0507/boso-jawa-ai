from fastapi.testclient import TestClient

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
