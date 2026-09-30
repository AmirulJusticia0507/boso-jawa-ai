"""Test audit trail admin dan security headers."""

from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.v1.endpoints.admin import _fingerprint, _redact, record_audit
from app.core.config import settings
from app.core.database import get_db
from app.main import app
from app.models.audit_log import AuditLog
from app.models.kawruh import KawruhBasa
from app.models.paribasan import Paribasan

ADMIN_KEY = "secret-admin-key"


@pytest.fixture
def audit_engine():
    """Engine SQLite in-memory bersama, supaya session baru bisa membuka data sama."""
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Hanya tabel yang disentuh endpoint admin; `create_all` tidak bisa dipakai
    # karena beberapa model memakai tipe Postgres (JSONB) yang tidak di-render SQLite.
    for table in (AuditLog.__table__, KawruhBasa.__table__, Paribasan.__table__):
        table.create(bind=engine)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def db(audit_engine) -> Session:
    """Session SQLite in-memory: cukup untuk menguji penulisan audit_log."""
    session = sessionmaker(bind=audit_engine, expire_on_commit=False)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def admin_client(db: Session) -> TestClient:
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        client.headers.update({"X-Admin-Key": ADMIN_KEY})
        yield client
    app.dependency_overrides.pop(get_db, None)


def test_fingerprint_never_stores_raw_key() -> None:
    fingerprint = _fingerprint(ADMIN_KEY)
    assert fingerprint != ADMIN_KEY
    assert len(fingerprint) == 16
    assert fingerprint == _fingerprint(ADMIN_KEY)


def test_redact_hides_sensitive_fields() -> None:
    redacted = _redact({"ngoko": "basa", "admin_key": "rahasia", "api_key": "x"})
    assert redacted["ngoko"] == "basa"
    assert redacted["admin_key"] == "[redacted]"
    assert redacted["api_key"] == "[redacted]"


def test_record_audit_writes_row_without_committing(db: Session) -> None:
    request = SimpleNamespace(
        state=SimpleNamespace(
            admin_fingerprint=_fingerprint(ADMIN_KEY),
            request_id="req-1",
        ),
        headers={"user-agent": "pytest"},
        client=None,
        url=SimpleNamespace(path="/api/v1/admin/kawruh"),
        method="POST",
    )
    record_audit(
        db,
        request,
        action="kawruh.create",
        target_table="kawruh",
        target_id=7,
        changes={"ngoko": "basa"},
    )
    entry = db.scalars(select(AuditLog).order_by(AuditLog.id.desc())).first()
    assert entry is not None
    assert entry.action == "kawruh.create"
    assert entry.target_id == 7
    assert entry.request_id == "req-1"
    assert entry.admin_key_fingerprint == _fingerprint(ADMIN_KEY)
    assert "basa" in entry.changes


def test_audit_log_endpoint_requires_admin_key(client, monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_api_key", ADMIN_KEY)
    assert client.get("/api/v1/admin/audit-logs").status_code == 401


def test_audit_log_endpoint_lists_entries(admin_client: TestClient, monkeypatch) -> None:
    """Aksi tulis harus muncul di log, lalu bisa dibaca kembali lewat endpoint."""
    monkeypatch.setattr(settings, "admin_api_key", ADMIN_KEY)
    created = admin_client.post(
        "/api/v1/admin/kawruh",
        json={"ngoko": "basa", "krama_lugu": "basa", "krama_inggil": "basa", "bahasa_indonesia": "bahasa"},
    )
    assert created.status_code == 200

    response = admin_client.get("/api/v1/admin/audit-logs")
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["total"] >= 1
    actions = [item["action"] for item in body["items"]]
    assert "kawruh.create" in actions


def test_read_only_actions_are_persisted(admin_client: TestClient, audit_engine, monkeypatch) -> None:
    """Regresi: aksi read-only pernah di-flush tanpa commit lalu hilang.

    Dua panggilan /admin/stats harus menyisakan dua baris audit_log yang terlihat
    dari session BARU — bukan hanya session yang dipakai selama request.
    """
    monkeypatch.setattr(settings, "admin_api_key", ADMIN_KEY)
    assert admin_client.get("/api/v1/admin/stats").status_code == 200
    assert admin_client.get("/api/v1/admin/stats").status_code == 200

    with sessionmaker(bind=audit_engine)() as fresh:
        rows = fresh.scalars(
            select(AuditLog).where(AuditLog.action == "stats.view").order_by(AuditLog.id)
        ).all()

    assert len(rows) == 2
    assert all(row.request_id for row in rows)
    assert all(row.admin_key_fingerprint == _fingerprint(ADMIN_KEY) for row in rows)


def test_viewing_audit_logs_does_not_list_itself(admin_client: TestClient, monkeypatch) -> None:
    """Membaca log tidak boleh memasukkan baris 'audit_log.view' ke halamannya sendiri."""
    monkeypatch.setattr(settings, "admin_api_key", ADMIN_KEY)
    response = admin_client.get("/api/v1/admin/audit-logs")
    assert response.status_code == 200
    actions = [item["action"] for item in response.json()["data"]["items"]]
    assert "audit_log.view" not in actions

    # ...tetap tercatat untuk permintaan berikutnya.
    follow_up = admin_client.get("/api/v1/admin/audit-logs", params={"action": "audit_log.view"})
    assert follow_up.status_code == 200
    assert follow_up.json()["data"]["total"] == 1


def test_audit_log_endpoint_filters_by_action(admin_client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_api_key", ADMIN_KEY)
    response = admin_client.get("/api/v1/admin/audit-logs", params={"action": "tidak.ada"})
    assert response.status_code == 200
    assert response.json()["data"]["items"] == []


def test_audit_entry_never_contains_raw_admin_key(admin_client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(settings, "admin_api_key", ADMIN_KEY)
    response = admin_client.get("/api/v1/admin/audit-logs")
    assert ADMIN_KEY not in response.text


def test_security_headers_present_on_health(client) -> None:
    response = client.get("/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "frame-ancestors 'none'" in response.headers["Content-Security-Policy"]
    assert "object-src 'none'" in response.headers["Content-Security-Policy"]
    assert "Permissions-Policy" in response.headers
    assert response.headers["Cache-Control"] == "no-store"


def test_security_headers_on_error_responses(client) -> None:
    response = client.get("/api/v1/admin/stats")
    assert response.status_code in (401, 503)
    assert response.headers["X-Content-Type-Options"] == "nosniff"
