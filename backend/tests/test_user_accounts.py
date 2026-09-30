from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.main import app
from app.models.user import UserAccount, UserBookmark, UserFeedback, UserHistory


@pytest.fixture
def user_client() -> Iterator[TestClient]:
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    for table in (UserAccount.__table__, UserHistory.__table__, UserBookmark.__table__, UserFeedback.__table__):
        table.create(engine)
    db = Session(engine)

    def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.pop(get_db, None)
    db.close()


def register(user_client: TestClient) -> dict[str, str]:
    challenge = user_client.get("/api/v1/users/captcha").json()
    left, right = (int(value) for value in challenge["question"].split(" = ")[0].split(" + "))
    response = user_client.post("/api/v1/users/register", json={"username": "sugeng", "password": "rahasia123", "captcha_token": challenge["token"], "captcha_answer": left + right})
    assert response.status_code == 201
    return response.json()


def test_account_sync_bookmark_and_feedback(user_client: TestClient) -> None:
    token = register(user_client)["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert user_client.get("/api/v1/users/me", headers=headers).json()["data"]["username"] == "sugeng"

    synced = user_client.post("/api/v1/users/history/sync", headers=headers, json={"items": [{
        "client_id": "local-1", "type": "transliterasi", "input": "jawa", "output": "ꦗꦮ", "timestamp": 1,
    }]})
    assert synced.status_code == 200
    assert synced.json()["data"][0]["id"] == "local-1"

    bookmark = user_client.post("/api/v1/users/bookmarks", headers=headers, json={
        "resource_type": "paribasan", "resource_id": "1", "title": "Tuladha", "collection": "Sinau", "note": None,
    })
    assert bookmark.status_code == 201
    assert user_client.get("/api/v1/users/bookmarks", headers=headers).json()[0]["collection"] == "Sinau"

    feedback = user_client.post("/api/v1/users/feedback", headers=headers, json={
        "resource_type": "paribasan", "resource_id": "1", "message": "Tegese kurang trep", "suggestion": "Usulan anyar",
    })
    assert feedback.status_code == 201
    assert feedback.json()["data"]["status"] == "open"


def test_user_token_cannot_access_admin_session(user_client: TestClient) -> None:
    token = register(user_client)["access_token"]
    response = user_client.get("/api/v1/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_login_rejects_invalid_captcha(user_client: TestClient) -> None:
    register(user_client)
    challenge = user_client.get("/api/v1/users/captcha").json()
    response = user_client.post("/api/v1/users/login", json={
        "username": "sugeng", "password": "rahasia123",
        "captcha_token": challenge["token"], "captcha_answer": 99,
    })
    assert response.status_code == 400
