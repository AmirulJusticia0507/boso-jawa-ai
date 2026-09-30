"""Test endpoint dataset AI: otorisasi admin, ekspor, impor, dan audit."""

import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.database import get_db
from app.main import app
from app.models.ai_dataset import AITrainingDataset
from app.models.audit_log import AuditLog

ADMIN_KEY = "secret-admin-key"

DATASET_ROUTES = [
    ("get", "/api/v1/ai/dataset/export"),
    ("get", "/api/v1/ai/dataset/export/download"),
    ("get", "/api/v1/ai/dataset/stats"),
    ("post", "/api/v1/ai/dataset/import"),
    ("patch", "/api/v1/ai/dataset/1"),
]


@pytest.fixture
def dataset_db():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    for table in (AITrainingDataset.__table__, AuditLog.__table__):
        table.create(bind=engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def dataset_client(dataset_db) -> TestClient:
    def override_get_db():
        yield dataset_db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def dataset_admin_client(dataset_client: TestClient) -> TestClient:
    dataset_client.headers.update({"X-Admin-Key": ADMIN_KEY})
    return dataset_client


@pytest.fixture(autouse=True)
def _admin_key(monkeypatch):
    monkeypatch.setattr(settings, "admin_api_key", ADMIN_KEY)


def _seed(dataset_db) -> AITrainingDataset:
    row = AITrainingDataset(
        prompt="apa kabar",
        completion="kabar apik",
        kategori="sapaan",
        is_verified=True,
    )
    dataset_db.add(row)
    dataset_db.commit()
    dataset_db.refresh(row)
    return row


@pytest.mark.parametrize(("method", "url"), DATASET_ROUTES)
def test_dataset_endpoints_require_admin_key(
    dataset_client: TestClient, method: str, url: str
) -> None:
    """Dataset pelatihan tidak boleh terbaca atau diubah tanpa kunci admin."""
    caller = getattr(dataset_client, method)
    response = caller(url, json={}) if method != "get" else caller(url)
    assert response.status_code == 401


def test_export_dataset_returns_jsonl_content(dataset_admin_client: TestClient, dataset_db) -> None:
    _seed(dataset_db)
    response = dataset_admin_client.get("/api/v1/ai/dataset/export", params={"format": "jsonl"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["format"] == "jsonl"
    assert data["count"] == 1
    assert json.loads(data["content"].strip())["prompt"] == "apa kabar"


def test_export_dataset_rejects_unknown_format(dataset_admin_client: TestClient) -> None:
    response = dataset_admin_client.get("/api/v1/ai/dataset/export", params={"format": "xml"})
    assert response.status_code == 422


def test_download_dataset_streams_file(dataset_admin_client: TestClient, dataset_db) -> None:
    _seed(dataset_db)
    response = dataset_admin_client.get(
        "/api/v1/ai/dataset/export/download", params={"format": "csv"}
    )
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "attachment" in response.headers["content-disposition"]
    assert "kabar apik" in response.text


def test_import_dataset_persists_rows_and_writes_audit(
    dataset_admin_client: TestClient, dataset_db
) -> None:
    payload = {
        "raw": json.dumps(
            [
                {"prompt": "apa kabar", "completion": "kabar apik", "kategori": "sapaan"},
                {"prompt": "lho", "completion": "nè", "kategori": "sapaan"},
            ]
        ),
        "content_type": "application/json",
        "mark_verified": True,
    }
    response = dataset_admin_client.post("/api/v1/ai/dataset/import", json=payload)
    assert response.status_code == 200
    assert response.json()["data"]["created"] == 2

    saved = dataset_db.scalars(select(AITrainingDataset)).all()
    assert {row.prompt for row in saved} == {"apa kabar", "lho"}
    assert all(row.is_verified for row in saved)

    actions = list(dataset_db.scalars(select(AuditLog.action)))
    assert "ai_dataset.import" in actions


def test_import_dataset_strict_mode_rolls_back(
    dataset_admin_client: TestClient, dataset_db
) -> None:
    payload = {
        "raw": json.dumps([{"prompt": "", "completion": "x", "kategori": "sapaan"}]),
        "content_type": "application/json",
    }
    response = dataset_admin_client.post(
        "/api/v1/ai/dataset/import", params={"strict": "true"}, json=payload
    )
    assert response.status_code == 422
    assert dataset_db.scalars(select(AITrainingDataset)).all() == []


def test_import_dataset_is_idempotent_on_second_run(
    dataset_admin_client: TestClient, dataset_db
) -> None:
    payload = {
        "raw": json.dumps(
            [{"prompt": "apa kabar", "completion": "kabar apik", "kategori": "sapaan"}]
        ),
        "content_type": "application/json",
    }
    assert dataset_admin_client.post("/api/v1/ai/dataset/import", json=payload).status_code == 200
    second = dataset_admin_client.post("/api/v1/ai/dataset/import", json=payload)
    assert second.status_code == 200
    assert second.json()["data"]["created"] == 0
    assert second.json()["data"]["skipped_existing"] == 1
    assert len(dataset_db.scalars(select(AITrainingDataset)).all()) == 1


def test_verify_dataset_item_toggles_and_audits(
    dataset_admin_client: TestClient, dataset_db
) -> None:
    row = _seed(dataset_db)
    response = dataset_admin_client.patch(
        f"/api/v1/ai/dataset/{row.id}", json={"is_verified": False}
    )
    assert response.status_code == 200
    assert response.json()["data"]["is_verified"] is False

    entry = dataset_db.scalars(
        select(AuditLog).where(AuditLog.action == "ai_dataset.verify")
    ).first()
    assert entry is not None
    assert entry.target_id == row.id
    assert '"from": true' in entry.changes.replace("'", '"')


def test_verify_dataset_item_returns_404_for_unknown_id(
    dataset_admin_client: TestClient,
) -> None:
    response = dataset_admin_client.patch("/api/v1/ai/dataset/9999", json={"is_verified": True})
    assert response.status_code == 404


def test_dataset_stats_reports_verified_ratio(
    dataset_admin_client: TestClient, dataset_db
) -> None:
    _seed(dataset_db)
    dataset_db.add(
        AITrainingDataset(prompt="x", completion="y", kategori="sapaan", is_verified=False)
    )
    dataset_db.commit()

    response = dataset_admin_client.get("/api/v1/ai/dataset/stats")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total"] == 2
    assert data["verified"] == 1
    assert data["unverified"] == 1
    assert data["verified_ratio"] == 0.5
