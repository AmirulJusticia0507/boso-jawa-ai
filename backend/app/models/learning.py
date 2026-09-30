"""Tabel soal kuis dan progres belajar."""

from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class QuestionCategory(str, PyEnum):
    AKSARA = "aksara"
    UNGGAH_UNGGUH = "unggah_ungguh"


class QuestionDifficulty(str, PyEnum):
    MUDAH = "mudah"
    SEDANG = "sedang"
    SULIT = "sulit"


class QuizQuestion(Base):
    __tablename__ = "quiz_question"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[QuestionCategory] = mapped_column(Enum(QuestionCategory), nullable=False, index=True)
    difficulty: Mapped[QuestionDifficulty] = mapped_column(Enum(QuestionDifficulty), default=QuestionDifficulty.SEDANG, nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array of strings
    correct_answer: Mapped[str] = mapped_column(String(200), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sessions: Mapped[list["QuizSession"]] = relationship(back_populates="question")


class QuizSession(Base):
    __tablename__ = "quiz_session"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_identifier: Mapped[str] = mapped_column(String(128), nullable=False, index=True)  # anon ID atau user ID nanti
    question_id: Mapped[int] = mapped_column(ForeignKey("quiz_question.id"), nullable=False, index=True)
    selected_answer: Mapped[str] = mapped_column(String(200), nullable=False)
    is_correct: Mapped[bool] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    question: Mapped[QuizQuestion] = relationship(back_populates="sessions")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_identifier: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    category: Mapped[QuestionCategory] = mapped_column(Enum(QuestionCategory), nullable=False)
    total_questions: Mapped[int] = mapped_column(default=0, nullable=False)
    correct_answers: Mapped[int] = mapped_column(default=0, nullable=False)
    best_streak: Mapped[int] = mapped_column(default=0, nullable=False)
    current_streak: Mapped[int] = mapped_column(default=0, nullable=False)
    last_studied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_user_progress_user_category", "user_identifier", "category", unique=True),
    )


class FlashcardReview(Base):
    __tablename__ = "flashcard_review"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_identifier: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("quiz_question.id"), nullable=False, index=True)
    repetitions: Mapped[int] = mapped_column(default=0, nullable=False)
    interval_days: Mapped[int] = mapped_column(default=0, nullable=False)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    question: Mapped[QuizQuestion] = relationship()

    __table_args__ = (UniqueConstraint("user_identifier", "question_id", name="uq_flashcard_user_question"),)
