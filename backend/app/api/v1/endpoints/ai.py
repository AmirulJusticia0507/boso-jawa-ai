"""Endpoint dataset AI (stub — implementasi menyusul, lihat docs/API_SPEC.md)."""

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/dataset/export")
def export_dataset() -> dict:
    raise HTTPException(
        status_code=501,
        detail="Ekspor dataset AI (JSONL/Parquet) belum diimplementasikan.",
    )


@router.post("/dataset/import")
def import_dataset() -> dict:
    raise HTTPException(
        status_code=501,
        detail="Impor dataset AI belum diimplementasikan.",
    )
