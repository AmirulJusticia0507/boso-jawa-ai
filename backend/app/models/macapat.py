"""Tabel paugeran tembang macapat."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Macapat(Base):
    __tablename__ = "macapat"

    id: Mapped[int] = mapped_column(primary_key=True)
    nama_tembang: Mapped[str] = mapped_column(String(50), unique=True)
    paugeran_gatra: Mapped[int] = mapped_column(Integer)
    paugeran_wilangan_lagu: Mapped[list] = mapped_column(JSONB)
    watak: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
