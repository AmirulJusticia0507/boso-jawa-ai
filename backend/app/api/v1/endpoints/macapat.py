"""Endpoint validasi paugeran Tembang Macapat."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.macapat import Macapat
from app.schemas.macapat import MacapatCheckRequest, MacapatCheckResponse
from app.services.macapat_checker import PAUGERAN, check_lirik

router = APIRouter()


@router.post("/check", response_model=MacapatCheckResponse)
def check_macapat(payload: MacapatCheckRequest, db: Session = Depends(get_db)) -> dict:
    key = payload.nama_tembang.strip().lower()

    row = db.execute(
        select(Macapat).where(Macapat.nama_tembang.ilike(payload.nama_tembang.strip()))
    ).scalar_one_or_none()

    if row is not None:
        paugeran = row.paugeran_wilangan_lagu
        nama = row.nama_tembang
    elif key in PAUGERAN:
        paugeran = [
            {"wilangan": w, "lagu": lg} for w, lg in PAUGERAN[key]["paugeran"]
        ]
        nama = payload.nama_tembang.strip()
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Tembang '{payload.nama_tembang}' tidak ditemukan.",
        )

    result = check_lirik(nama, payload.lirik, paugeran)
    return {"status": "success", **result}
