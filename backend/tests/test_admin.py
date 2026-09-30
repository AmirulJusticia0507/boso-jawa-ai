from app.core.config import settings


def test_admin_is_disabled_without_key(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_api_key", "")
    response = client.get("/api/v1/admin/stats")
    assert response.status_code == 503


def test_admin_rejects_wrong_key_before_database_access(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_api_key", "correct-key")
    response = client.get("/api/v1/admin/stats", headers={"X-Admin-Key": "wrong-key"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Kunci admin tidak valid."
