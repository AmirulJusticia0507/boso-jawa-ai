"""Endpoint pencarian kamus Undha-Usuk Basa."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.kawruh import KawruhBasa
from app.schemas.kawruh import KawruhSearchResponse

router = APIRouter()


@router.get("/search", response_model=KawruhSearchResponse)
def search_kawruh(
    q: str = Query(..., min_length=1, description="Kata kunci pencarian"),
    limit: int = Query(10, ge=1, le=100, description="Jumlah maksimal data"),
    db: Session = Depends(get_db),
) -> dict:
    pattern = f"%{q}%"
    stmt = (
        select(KawruhBasa)
        .where(
            or_(
                KawruhBasa.ngoko.ilike(pattern),
                KawruhBasa.krama_lugu.ilike(pattern),
                KawruhBasa.krama_inggil.ilike(pattern),
                KawruhBasa.bahasa_indonesia.ilike(pattern),
            )
        )
        .limit(limit)
    )
    rows = db.execute(stmt).scalars().all()
    return {"status": "success", "total": len(rows), "data": rows}
