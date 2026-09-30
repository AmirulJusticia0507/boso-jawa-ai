"""Akun pengguna dan data pribadi lintas perangkat."""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserAccount(Base):
    __tablename__ = "user_account"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserHistory(Base):
    __tablename__ = "user_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_account.id", ondelete="CASCADE"), index=True)
    client_id: Mapped[str] = mapped_column(String(64))
    type: Mapped[str] = mapped_column(String(30))
    input: Mapped[str] = mapped_column(Text)
    output: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[int] = mapped_column(BigInteger)
    __table_args__ = (UniqueConstraint("user_id", "client_id", name="uq_user_history_client"),)


class UserBookmark(Base):
    __tablename__ = "user_bookmark"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_account.id", ondelete="CASCADE"), index=True)
    resource_type: Mapped[str] = mapped_column(String(30))
    resource_id: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(255))
    collection: Mapped[str] = mapped_column(String(100), default="Favorit")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("user_id", "resource_type", "resource_id", name="uq_user_bookmark_resource"),)


class UserFeedback(Base):
    __tablename__ = "user_feedback"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_account.id", ondelete="CASCADE"), index=True)
    resource_type: Mapped[str] = mapped_column(String(30))
    resource_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    message: Mapped[str] = mapped_column(Text)
    suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
