"""Tabel referensi aksara Jawa."""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AksaraJawa(Base):
    __tablename__ = "aksara_jawa"

    id: Mapped[int] = mapped_column(primary_key=True)
    karakter: Mapped[str] = mapped_column(String(10))
    nama: Mapped[str] = mapped_column(String(50))
    jenis: Mapped[str] = mapped_column(String(30))
    latin_equivalent: Mapped[str | None] = mapped_column(String(10), nullable=True)
    deskripsi: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
