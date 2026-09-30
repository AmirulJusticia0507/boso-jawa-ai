"""Endpoint daftar paribasan, bebasan, lan saloka."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
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
    page: int = Query(1, ge=1, description="Nomor halaman"),
    limit: int = Query(50, ge=1, le=200, description="Jumlah maksimal data"),
    db: Session = Depends(get_db),
) -> dict:
    valid_kategori = {"paribasan", "bebasan", "saloka"}
    if kategori is not None and kategori not in valid_kategori:
        kategori = None

    stmt = select(Paribasan).where(Paribasan.status == "published").order_by(Paribasan.id)
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
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = db.execute(stmt.offset((page - 1) * limit).limit(limit)).scalars().all()
    return {
        "status": "success",
        "total": total,
        "page": page,
        "limit": limit,
        "has_next": page * limit < total,
        "data": rows,
    }
