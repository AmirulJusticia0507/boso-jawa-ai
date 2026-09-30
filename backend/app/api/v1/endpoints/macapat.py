"""Endpoint validasi paugeran Tembang Macapat."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.macapat import Macapat
from app.schemas.macapat import (
    MacapatCheckRequest,
    MacapatCheckResponse,
    MacapatListItem,
    MacapatListResponse,
)
from app.services.macapat_checker import (
    PAUGERAN,
    available_tembang,
    check_lirik,
    resolve_tembang,
)
from app.services.rate_limiter import client_identifier, limiter

router = APIRouter()


def _load_paugeran(nama_tembang: str, db: Session) -> tuple[str, list] | None:
    """Cari paugeran di database; kembali ke bawaan bila tidak ada."""
    try:
        row = db.execute(
            select(Macapat)
            .where(Macapat.nama_tembang.ilike(nama_tembang.strip()))
            .limit(1)
        ).scalar_one_or_none()
    except Exception:  # noqa: BLE001 — database tidak wajib untuk path bawaan
        row = None

    if row is not None:
        return row.nama_tembang, list(row.paugeran_wilangan_lagu)

    canonical = resolve_tembang(nama_tembang)
    if canonical is None:
        return None
    spec = PAUGERAN[canonical]
    return canonical.capitalize(), [
        {"wilangan": w, "lagu": lagu} for w, lagu in spec["paugeran"]
    ]


@router.get("", response_model=MacapatListResponse)
@router.get("/", response_model=MacapatListResponse, include_in_schema=False)
def list_macapat(
    request: Request,
    db: Session = Depends(get_db),
    q: str | None = Query(default=None, max_length=100),
) -> dict:
    """Daftar tembang macapat beserta paugeran, alias, dan watak.

    Paugeran dari database (tabel `macapat`) menang bila tersedia, sehingga
    admin bisa customizing aturan tanpa deploy ulang.
    """
    limiter.check(f"macapat:list:{client_identifier(request)}", 60)

    items = available_tembang()
    for item in items:
        loaded = _load_paugeran(item["nama_tembang"], db)
        if loaded is not None:
            nama, paugeran = loaded
            item["nama_tembang"] = nama
            item["gatra"] = len(paugeran)
            item["paugeran"] = [
                {"gatra": index + 1, "wilangan": int(p["wilangan"]), "lagu": str(p["lagu"])}
                for index, p in enumerate(paugeran)
            ]

    if q:
        needle = q.strip().lower()
        items = [
            item
            for item in items
            if needle in item["nama_tembang"].lower()
            or any(needle in alias for alias in item["alias"])
            or needle in (item["watak"] or "").lower()
        ]

    return {
        "status": "success",
        "data": items,
        "total": len(items),
    }


@router.post("/check", response_model=MacapatCheckResponse)
def check_macapat(payload: MacapatCheckRequest, db: Session = Depends(get_db)) -> dict:
    loaded = _load_paugeran(payload.nama_tembang, db)
    if loaded is None:
        raise HTTPException(
            status_code=404,
            detail=f"Tembang '{payload.nama_tembang}' tidak ditemukan.",
        )
    nama, paugeran = loaded
    result = check_lirik(nama, payload.lirik, paugeran)
    return {"status": "success", **result}


@router.get("/tembang/{nama_tembang}", response_model=MacapatListItem)
def get_macapat(nama_tembang: str, db: Session = Depends(get_db)) -> dict:
    """Detail satu tembang; menerima alias (mis. 'kinanti')."""
    loaded = _load_paugeran(nama_tembang, db)
    if loaded is None:
        raise HTTPException(
            status_code=404,
            detail=f"Tembang '{nama_tembang}' tidak ditemukan.",
        )
    nama, paugeran = loaded
    canonical = resolve_tembang(nama) or nama.lower()
    spec = PAUGERAN.get(canonical, {})
    return {
        "nama_tembang": nama,
        "alias": sorted(k for k, v in _aliases().items() if v == canonical),
        "gatra": len(paugeran),
        "paugeran": [
            {"gatra": index + 1, "wilangan": int(p["wilangan"]), "lagu": str(p["lagu"])}
            for index, p in enumerate(paugeran)
        ],
        "watak": spec.get("watak"),
    }


def _aliases() -> dict[str, str]:
    from app.services.macapat_checker import ALIASES

    return ALIASES
