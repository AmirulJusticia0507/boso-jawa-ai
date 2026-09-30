"""Endpoint pencarian kamus Undha-Usuk Basa."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, or_, select
from sqlalchemy.sql import Select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.kawruh import KawruhBasa
from app.schemas.kawruh import KawruhSearchResponse

router = APIRouter()

SEARCH_COLUMNS = (
    KawruhBasa.ngoko,
    KawruhBasa.krama_lugu,
    KawruhBasa.krama_inggil,
    KawruhBasa.bahasa_indonesia,
)


def build_search_statement(query: str) -> Select:
    """Build a typo-tolerant query with deterministic relevance ranking."""
    normalized = query.strip().lower()
    contains = f"%{normalized}%"
    prefix = f"{normalized}%"
    similarities = [func.similarity(column, normalized) for column in SEARCH_COLUMNS]
    best_similarity = func.greatest(*similarities)

    exact_rank = case(
        (or_(*(func.lower(column) == normalized for column in SEARCH_COLUMNS)), 0),
        (or_(*(column.ilike(prefix) for column in SEARCH_COLUMNS)), 1),
        else_=2,
    )
    return (
        select(KawruhBasa)
        .where(
            or_(
                *(column.ilike(contains) for column in SEARCH_COLUMNS),
                best_similarity >= 0.2,
            )
        )
        .order_by(exact_rank, best_similarity.desc(), KawruhBasa.ngoko)
    )


@router.get("/search", response_model=KawruhSearchResponse)
def search_kawruh(
    q: str = Query(..., min_length=1, description="Kata kunci pencarian"),
    limit: int = Query(10, ge=1, le=100, description="Jumlah maksimal data"),
    db: Session = Depends(get_db),
) -> dict:
    if not q.strip():
        raise HTTPException(status_code=422, detail="Kata kunci tidak boleh kosong.")
    stmt = build_search_statement(q).limit(limit)
    rows = db.execute(stmt).scalars().all()
    return {"status": "success", "total": len(rows), "data": rows}
