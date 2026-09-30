"""Skema endpoint kuis dan belajar."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


QuestionCategory = Literal["aksara", "unggah_ungguh"]
QuestionDifficulty = Literal["mudah", "sedang", "sulit"]


class QuizQuestionBase(BaseModel):
    category: QuestionCategory
    difficulty: QuestionDifficulty = "sedang"
    prompt: str = Field(..., min_length=1)
    options: list[str] = Field(..., min_length=2)
    correct_answer: str = Field(..., min_length=1)
    explanation: Optional[str] = None
    is_active: bool = True


class QuizQuestionCreate(QuizQuestionBase):
    pass


class QuizQuestionUpdate(BaseModel):
    category: Optional[QuestionCategory] = None
    difficulty: Optional[QuestionDifficulty] = None
    prompt: Optional[str] = Field(default=None, min_length=1)
    options: Optional[list[str]] = Field(default=None, min_length=2)
    correct_answer: Optional[str] = Field(default=None, min_length=1)
    explanation: Optional[str] = None
    is_active: Optional[bool] = None


class QuizQuestionItem(QuizQuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class QuizQuestionListResponse(BaseModel):
    status: str = "success"
    total: int
    page: int
    limit: int
    has_next: bool
    data: list[QuizQuestionItem]


class QuizSessionCreate(BaseModel):
    question_id: int
    selected_answer: str


class QuizSessionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_identifier: str
    question_id: int
    selected_answer: str
    is_correct: bool
    created_at: datetime


class QuizSubmitResponse(BaseModel):
    status: str = "success"
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    score: int
    total: int
    progress: dict


class QuizStartRequest(BaseModel):
    category: Optional[QuestionCategory] = None
    difficulty: Optional[QuestionDifficulty] = None
    limit: int = Field(default=10, ge=1, le=50)
    adaptive: bool = False


class QuizQuestionForQuiz(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: QuestionCategory
    difficulty: QuestionDifficulty
    prompt: str
    options: list[str]
    correct_answer: str
    explanation: Optional[str] = None


class QuizStartResponse(BaseModel):
    status: str = "success"
    questions: list[QuizQuestionForQuiz]
    total: int


class UserProgressItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_identifier: str
    category: QuestionCategory
    total_questions: int
    correct_answers: int
    best_streak: int
    current_streak: int
    last_studied_at: Optional[datetime]
    accuracy: float


class UserProgressResponse(BaseModel):
    status: str = "success"
    data: list[UserProgressItem]


class LearningStatsResponse(BaseModel):
    status: str = "success"
    data: dict


class FlashcardItem(BaseModel):
    id: int
    category: QuestionCategory
    difficulty: QuestionDifficulty
    front: str
    back: str
    explanation: Optional[str] = None
    due_at: Optional[datetime] = None


class FlashcardListResponse(BaseModel):
    status: str = "success"
    data: list[FlashcardItem]
    due: int


class FlashcardReviewRequest(BaseModel):
    quality: Literal["again", "hard", "good", "easy"]
