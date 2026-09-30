"""Endpoint pencarian kamus Undha-Usuk Basa."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, or_, select
from sqlalchemy.sql import Select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.kawruh import KawruhBasa
from app.schemas.kawruh import CorrectionRequest, CorrectionResponse, KawruhSearchResponse
from app.services.undha_usuk import correct_sentence

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
    page: int = Query(1, ge=1, description="Nomor halaman"),
    limit: int = Query(10, ge=1, le=100, description="Jumlah maksimal data"),
    db: Session = Depends(get_db),
) -> dict:
    if not q.strip():
        raise HTTPException(status_code=422, detail="Kata kunci tidak boleh kosong.")
    base_stmt = build_search_statement(q)
    total = db.scalar(select(func.count()).select_from(base_stmt.order_by(None).subquery())) or 0
    rows = db.execute(base_stmt.offset((page - 1) * limit).limit(limit)).scalars().all()
    return {
        "status": "success",
        "total": total,
        "page": page,
        "limit": limit,
        "has_next": page * limit < total,
        "data": rows,
    }


@router.post("/correct", response_model=CorrectionResponse)
def correct_undha_usuk(
    payload: CorrectionRequest,
    db: Session = Depends(get_db),
) -> dict:
    if not payload.text.strip():
        raise HTTPException(status_code=422, detail="Kalimat tidak boleh kosong.")
    entries = db.execute(select(KawruhBasa)).scalars().all()
    corrected, changes = correct_sentence(payload.text, payload.target_level, entries)
    return {
        "status": "success",
        "original": payload.text,
        "corrected": corrected,
        "target_level": payload.target_level,
        "changes": changes,
        "note": (
            "Koreksi berbasis padanan kata dalam kamus. Konteks subjek, lawan bicara, "
            "dan ragam daerah tetap perlu diperiksa penutur ahli."
        ),
    }
