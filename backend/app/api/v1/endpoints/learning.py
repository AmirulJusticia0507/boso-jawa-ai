"""Endpoint kuis dan pembelajaran."""

import json
import random
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.learning import QuizQuestion, QuizSession, UserProgress, QuestionCategory, QuestionDifficulty
from app.schemas.learning import (
    LearningStatsResponse,
    QuizQuestionCreate,
    QuizQuestionItem,
    QuizQuestionListResponse,
    QuizQuestionUpdate,
    QuizSessionCreate,
    QuizSessionItem,
    QuizStartRequest,
    QuizStartResponse,
    QuizSubmitResponse,
    UserProgressItem,
    UserProgressResponse,
)

router = APIRouter()


def _get_or_create_user_identifier(request: Request) -> str:
    """Ambil atau buat anonymous user identifier dari header/cookie."""
    # Cek header custom
    user_id = request.headers.get("X-User-Identifier")
    if user_id:
        return user_id
    # Fallback: gunakan IP + User-Agent hash
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    ua = request.headers.get("user-agent", "")[:100]
    return f"anon_{abs(hash(f'{ip}|{ua}'))}"


def _update_user_progress(db: Session, user_id: str, category: QuestionCategory, is_correct: bool) -> UserProgress:
    """Update progres belajar user per kategori."""
    progress = db.scalar(
        select(UserProgress).where(
            UserProgress.user_identifier == user_id,
            UserProgress.category == category,
        )
    )
    if progress is None:
        progress = UserProgress(
            user_identifier=user_id,
            category=category,
            total_questions=0,
            correct_answers=0,
            best_streak=0,
            current_streak=0,
        )
        db.add(progress)

    progress.total_questions += 1
    if is_correct:
        progress.correct_answers += 1
        progress.current_streak += 1
        progress.best_streak = max(progress.best_streak, progress.current_streak)
    else:
        progress.current_streak = 0
    progress.last_studied_at = func.now()
    return progress


@router.get("/questions", response_model=QuizQuestionListResponse)
def list_questions(
    request: Request,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[QuestionCategory] = None,
    difficulty: Optional[QuestionDifficulty] = None,
    is_active: Optional[bool] = None,
) -> dict:
    """Daftar soal kuis (admin)."""
    stmt = select(QuizQuestion)
    if category:
        stmt = stmt.where(QuizQuestion.category == category)
    if difficulty:
        stmt = stmt.where(QuizQuestion.difficulty == difficulty)
    if is_active is not None:
        stmt = stmt.where(QuizQuestion.is_active == is_active)

    stmt = stmt.order_by(QuizQuestion.id)
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = db.scalars(stmt.offset((page - 1) * limit).limit(limit)).all()

    return {
        "status": "success",
        "total": total,
        "page": page,
        "limit": limit,
        "has_next": page * limit < total,
        "data": [QuizQuestionItem.model_validate(row).model_dump() for row in rows],
    }


@router.post("/questions", response_model=QuizQuestionItem, status_code=201)
def create_question(
    payload: QuizQuestionCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> QuizQuestion:
    """Tambah soal kuis baru (admin)."""
    question = QuizQuestion(
        category=payload.category,
        difficulty=payload.difficulty,
        prompt=payload.prompt,
        options=json.dumps(payload.options, ensure_ascii=False),
        correct_answer=payload.correct_answer,
        explanation=payload.explanation,
        is_active=payload.is_active,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("/questions/{question_id}", response_model=QuizQuestionItem)
def get_question(question_id: int, db: Session = Depends(get_db)) -> QuizQuestion:
    """Detail soal kuis."""
    question = db.get(QuizQuestion, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Soal tidak ditemukan.")
    return question


@router.put("/questions/{question_id}", response_model=QuizQuestionItem)
def update_question(
    question_id: int,
    payload: QuizQuestionUpdate,
    db: Session = Depends(get_db),
) -> QuizQuestion:
    """Update soal kuis (admin)."""
    question = db.get(QuizQuestion, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Soal tidak ditemukan.")

    update_data = payload.model_dump(exclude_unset=True)
    if "options" in update_data:
        update_data["options"] = json.dumps(update_data["options"], ensure_ascii=False)

    for field, value in update_data.items():
        setattr(question, field, value)

    db.commit()
    db.refresh(question)
    return question


@router.delete("/questions/{question_id}", status_code=204)
def delete_question(question_id: int, db: Session = Depends(get_db)) -> Response:
    """Hapus soal kuis (admin)."""
    question = db.get(QuizQuestion, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Soal tidak ditemukan.")
    db.delete(question)
    db.commit()
    return Response(status_code=204)


# --- Quiz endpoints for users ---

@router.post("/quiz/start", response_model=QuizStartResponse)
def start_quiz(
    payload: QuizStartRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    """Mulai kuis baru: ambil soal acak berdasarkan filter."""
    stmt = select(QuizQuestion).where(QuizQuestion.is_active == True)

    if payload.category:
        stmt = stmt.where(QuizQuestion.category == payload.category)
    if payload.difficulty:
        stmt = stmt.where(QuizQuestion.difficulty == payload.difficulty)

    all_questions = db.scalars(stmt).all()
    if not all_questions:
        raise HTTPException(status_code=404, detail="Tidak ada soal yang tersedia untuk filter ini.")

    selected = random.sample(all_questions, min(payload.limit, len(all_questions)))

    questions_data = [
        {
            "id": q.id,
            "category": q.category.value,
            "difficulty": q.difficulty.value,
            "prompt": q.prompt,
            "options": json.loads(q.options),
        }
        for q in selected
    ]

    return {
        "status": "success",
        "questions": questions_data,
        "total": len(questions_data),
    }


@router.post("/quiz/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    payload: list[QuizSessionCreate],
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    """Submit jawaban kuis dan update progres."""
    user_id = _get_or_create_user_identifier(request)
    score = 0
    results = []

    for answer in payload:
        question = db.get(QuizQuestion, answer.question_id)
        if question is None:
            continue

        is_correct = answer.selected_answer == question.correct_answer
        if is_correct:
            score += 1

        # Simpan sesi jawaban
        session = QuizSession(
            user_identifier=user_id,
            question_id=answer.question_id,
            selected_answer=answer.selected_answer,
            is_correct=is_correct,
        )
        db.add(session)

        # Update progres per kategori
        _update_user_progress(db, user_id, question.category, is_correct)

        results.append({
            "question_id": answer.question_id,
            "is_correct": is_correct,
            "correct_answer": question.correct_answer,
            "explanation": question.explanation,
        })

    db.commit()

    # Hitung total soal yang dijawab user ini (untuk response)
    total_answered = len(payload)

    return {
        "status": "success",
        "is_correct": all(r["is_correct"] for r in results),
        "correct_answer": "",  # not single
        "explanation": None,
        "score": score,
        "total": total_answered,
        "progress": {"results": results},
    }


@router.get("/progress", response_model=UserProgressResponse)
def get_progress(
    request: Request,
    db: Session = Depends(get_db),
    category: Optional[QuestionCategory] = None,
) -> dict:
    """Ambil progres belajar user."""
    user_id = _get_or_create_user_identifier(request)
    stmt = select(UserProgress).where(UserProgress.user_identifier == user_id)
    if category:
        stmt = stmt.where(UserProgress.category == category)

    rows = db.scalars(stmt).all()

    data = []
    for row in rows:
        accuracy = (row.correct_answers / row.total_questions * 100) if row.total_questions > 0 else 0.0
        data.append(UserProgressItem(
            id=row.id,
            user_identifier=row.user_identifier,
            category=row.category.value,
            total_questions=row.total_questions,
            correct_answers=row.correct_answers,
            best_streak=row.best_streak,
            current_streak=row.current_streak,
            last_studied_at=row.last_studied_at,
            accuracy=round(accuracy, 1),
        ))

    return {"status": "success", "data": data}


@router.get("/stats", response_model=LearningStatsResponse)
def get_learning_stats(
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    """Statistik keseluruhan belajar user."""
    user_id = _get_or_create_user_identifier(request)

    # Total soal dijawab
    total_answered = db.scalar(
        select(func.count()).select_from(QuizSession).where(QuizSession.user_identifier == user_id)
    ) or 0

    # Total benar
    total_correct = db.scalar(
        select(func.count()).select_from(QuizSession).where(
            QuizSession.user_identifier == user_id,
            QuizSession.is_correct == True,
        )
    ) or 0

    # Progres per kategori
    progress_rows = db.scalars(
        select(UserProgress).where(UserProgress.user_identifier == user_id)
    ).all()

    # Sesi belajar (hari unik)
    study_days = db.scalar(
        select(func.count(func.distinct(func.date(QuizSession.created_at)))).where(
            QuizSession.user_identifier == user_id
        )
    ) or 0

    category_stats = {}
    for row in progress_rows:
        accuracy = (row.correct_answers / row.total_questions * 100) if row.total_questions > 0 else 0.0
        category_stats[row.category.value] = {
            "total": row.total_questions,
            "correct": row.correct_answers,
            "accuracy": round(accuracy, 1),
            "best_streak": row.best_streak,
            "current_streak": row.current_streak,
        }

    return {
        "status": "success",
        "data": {
            "total_answered": total_answered,
            "total_correct": total_correct,
            "overall_accuracy": round((total_correct / total_answered * 100) if total_answered > 0 else 0, 1),
            "study_days": study_days,
            "by_category": category_stats,
        },
    }