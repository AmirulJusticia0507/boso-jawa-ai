from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.main import app
from app.models.learning import FlashcardReview, QuizQuestion, QuizSession, UserProgress


@pytest.fixture
def learning_client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    for table in (QuizQuestion.__table__, UserProgress.__table__, QuizSession.__table__, FlashcardReview.__table__):
        table.create(engine)
    db = Session(engine)
    weak = QuizQuestion(category="aksara", difficulty="mudah", prompt="Soal angel", options='["a","b"]', correct_answer="a", is_active=True)
    strong = QuizQuestion(category="aksara", difficulty="mudah", prompt="Soal lancar", options='["a","b"]', correct_answer="b", is_active=True)
    db.add_all([weak, strong])
    db.flush()
    db.add_all([
        QuizSession(user_identifier="learner", question_id=weak.id, selected_answer="b", is_correct=False),
        QuizSession(user_identifier="learner", question_id=strong.id, selected_answer="b", is_correct=True),
    ])
    db.commit()

    def override_db() -> Iterator[Session]:
        yield db

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as client:
        client.headers["X-User-Identifier"] = "learner"
        yield client
    app.dependency_overrides.pop(get_db, None)
    db.close()


def test_adaptive_quiz_prioritizes_previous_mistakes(learning_client: TestClient) -> None:
    response = learning_client.post("/api/v1/learning/quiz/start", json={"adaptive": True, "limit": 1})
    assert response.status_code == 200
    assert response.json()["questions"][0]["prompt"] == "Soal angel"


def test_flashcard_review_schedules_card_and_removes_it_from_due_queue(learning_client: TestClient) -> None:
    due = learning_client.get("/api/v1/learning/flashcards/due?limit=10").json()["data"]
    reviewed_id = due[0]["id"]
    result = learning_client.post(
        f"/api/v1/learning/flashcards/{reviewed_id}/review",
        json={"quality": "good"},
    )
    assert result.status_code == 200
    assert result.json()["data"]["interval_days"] == 1
    assert reviewed_id not in {card["id"] for card in learning_client.get("/api/v1/learning/flashcards/due").json()["data"]}


def test_stats_include_mastery_per_material(learning_client: TestClient) -> None:
    data = learning_client.get("/api/v1/learning/stats").json()["data"]
    mastery = data["mastery"]
    assert mastery == [{
        "category": "aksara",
        "difficulty": "mudah",
        "attempted": 2,
        "correct": 1,
        "accuracy": 50.0,
        "level": "perlu_latihan",
    }]
    assert data["daily_activity"][0]["attempted"] == 2
    assert data["weakest_questions"][0]["accuracy"] == 0.0
    assert data["flashcards"] == {"due": 2, "reviewed": 0, "scheduled": 0}
