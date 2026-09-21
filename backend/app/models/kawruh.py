"""Tabel kamus padanan kata Undha-Usuk."""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class KawruhBasa(Base):
    __tablename__ = "kawruh_basa"

    id: Mapped[int] = mapped_column(primary_key=True)
    ngoko: Mapped[str] = mapped_column(String(100))
    krama_lugu: Mapped[str | None] = mapped_column(String(100), nullable=True)
    krama_inggil: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bahasa_indonesia: Mapped[str] = mapped_column(String(100))
    kelas_kata: Mapped[str] = mapped_column(String(30), default="Tembung Aran")
    contoh_ukara: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
