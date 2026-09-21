"""Endpoint daftar paribasan, bebasan, lan saloka."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.paribasan import Paribasan
from app.schemas.paribasan import ParibasanListResponse

router = APIRouter()


@router.get("", response_model=ParibasanListResponse)
def list_paribasan(
    kategori: str | None = Query(
        None, description="Filter kategori: paribasan, bebasan, atau saloka"
    ),
    q: str | None = Query(
        None, min_length=1, description="Kata kunci pencarian pada teks/tegese"
    ),
    limit: int = Query(50, ge=1, le=200, description="Jumlah maksimal data"),
    db: Session = Depends(get_db),
) -> dict:
    valid_kategori = {"paribasan", "bebasan", "saloka"}
    if kategori is not None and kategori not in valid_kategori:
        kategori = None

    stmt = select(Paribasan).order_by(Paribasan.id)
    if kategori is not None:
        stmt = stmt.where(Paribasan.kategori == kategori)
    if q is not None:
        pattern = f"%{q}%"
        stmt = stmt.where(
            or_(
                Paribasan.teks.ilike(pattern),
                Paribasan.tegese.ilike(pattern),
                Paribasan.padanan_indonesia.ilike(pattern),
            )
        )
    rows = db.execute(stmt.limit(limit)).scalars().all()
    return {"status": "success", "total": len(rows), "data": rows}