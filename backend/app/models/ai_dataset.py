"""Tabel dataset prompt-completion untuk fine-tuning LLM."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AITrainingDataset(Base):
    __tablename__ = "ai_training_dataset"

    id: Mapped[int] = mapped_column(primary_key=True)
    prompt: Mapped[str] = mapped_column(Text)
    completion: Mapped[str] = mapped_column(Text)
    kategori: Mapped[str] = mapped_column(String(50))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
