from app.core.config import settings


def test_admin_is_disabled_without_key(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_api_key", "")
    monkeypatch.setattr(settings, "editor_api_key", "")
    monkeypatch.setattr(settings, "reviewer_api_key", "")
    monkeypatch.setattr(settings, "jwt_secret_key", "")
    response = client.get("/api/v1/admin/stats")
    assert response.status_code == 401
    assert "Autentikasi diperlukan" in response.json()["detail"]


def test_admin_rejects_wrong_key_before_database_access(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_api_key", "correct-key")
    monkeypatch.setattr(settings, "editor_api_key", "")
    monkeypatch.setattr(settings, "reviewer_api_key", "")
    monkeypatch.setattr(settings, "jwt_secret_key", "")
    response = client.get("/api/v1/admin/stats", headers={"X-Admin-Key": "wrong-key"})
    assert response.status_code == 401
    assert "Autentikasi diperlukan" in response.json()["detail"]


def test_editor_session_exposes_role_and_permissions(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_api_key", "admin-key")
    monkeypatch.setattr(settings, "editor_api_key", "editor-key")
    monkeypatch.setattr(settings, "reviewer_api_key", "reviewer-key")
    monkeypatch.setattr(settings, "jwt_secret_key", "")

    response = client.get("/api/v1/admin/session", headers={"X-Admin-Key": "editor-key"})

    assert response.status_code == 200
    assert response.json()["data"]["role"] == "editor"
    assert "content.write" in response.json()["data"]["permissions"]
    assert "content.delete" not in response.json()["data"]["permissions"]


def test_reviewer_cannot_write_content(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_api_key", "admin-key")
    monkeypatch.setattr(settings, "editor_api_key", "editor-key")
    monkeypatch.setattr(settings, "reviewer_api_key", "reviewer-key")
    monkeypatch.setattr(settings, "jwt_secret_key", "")

    response = client.post(
        "/api/v1/admin/kawruh",
        headers={"X-Admin-Key": "reviewer-key"},
        json={"ngoko": "mangan", "bahasa_indonesia": "makan"},
    )

    assert response.status_code == 403
    assert "content.write" in response.json()["detail"]


def test_editor_cannot_read_audit_log(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_api_key", "admin-key")
    monkeypatch.setattr(settings, "editor_api_key", "editor-key")
    monkeypatch.setattr(settings, "reviewer_api_key", "reviewer-key")
    monkeypatch.setattr(settings, "jwt_secret_key", "")

    response = client.get("/api/v1/admin/audit-logs", headers={"X-Admin-Key": "editor-key"})

    assert response.status_code == 403
    assert "audit.read" in response.json()["detail"]


def test_reviewer_may_only_update_content_status(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_api_key", "admin-key")
    monkeypatch.setattr(settings, "editor_api_key", "editor-key")
    monkeypatch.setattr(settings, "reviewer_api_key", "reviewer-key")
    monkeypatch.setattr(settings, "jwt_secret_key", "")

    response = client.put(
        "/api/v1/admin/kawruh/1",
        headers={"X-Admin-Key": "reviewer-key"},
        json={"ngoko": "owah"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Reviewer hanya boleh mengubah status konten."
