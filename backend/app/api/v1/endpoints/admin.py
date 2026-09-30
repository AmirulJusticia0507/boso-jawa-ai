"""Protected CRUD endpoints for language content."""

import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.kawruh import KawruhBasa
from app.models.paribasan import Paribasan
from app.schemas.admin import (
    KawruhBulkImport,
    KawruhCreate,
    KawruhUpdate,
    ParibasanBulkImport,
    ParibasanCreate,
    ParibasanUpdate,
)
from app.schemas.kawruh import KawruhItem
from app.schemas.paribasan import ParibasanItem

router = APIRouter()


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    if not settings.admin_api_key:
        raise HTTPException(status_code=503, detail="Admin API belum dikonfigurasi.")
    if x_admin_key is None or not secrets.compare_digest(x_admin_key, settings.admin_api_key):
        raise HTTPException(status_code=401, detail="Kunci admin tidak valid.")


def _get_or_404(db: Session, model, item_id: int):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan.")
    return item


@router.get("/stats", dependencies=[Depends(require_admin)])
def stats(db: Session = Depends(get_db)) -> dict:
    return {
        "status": "success",
        "data": {
            "kawruh": db.scalar(select(func.count()).select_from(KawruhBasa)) or 0,
            "paribasan": db.scalar(select(func.count()).select_from(Paribasan)) or 0,
        },
    }


@router.get("/kawruh/export", dependencies=[Depends(require_admin)])
def export_kawruh(db: Session = Depends(get_db)) -> dict:
    rows = db.scalars(select(KawruhBasa).order_by(KawruhBasa.id)).all()
    return {
        "status": "success",
        "data": [KawruhItem.model_validate(row).model_dump() for row in rows],
    }


@router.post("/kawruh/import", dependencies=[Depends(require_admin)])
def import_kawruh(payload: KawruhBulkImport, db: Session = Depends(get_db)) -> dict:
    existing = {value.lower() for value in db.scalars(select(KawruhBasa.ngoko)).all()}
    created, skipped = 0, []
    for incoming in payload.items:
        key = incoming.ngoko.lower()
        if key in existing:
            skipped.append(incoming.ngoko)
            continue
        db.add(KawruhBasa(**incoming.model_dump()))
        existing.add(key)
        created += 1
    db.commit()
    return {"status": "success", "created": created, "skipped_duplicates": skipped}


@router.get("/paribasan/export", dependencies=[Depends(require_admin)])
def export_paribasan(db: Session = Depends(get_db)) -> dict:
    rows = db.scalars(select(Paribasan).order_by(Paribasan.id)).all()
    return {
        "status": "success",
        "data": [ParibasanItem.model_validate(row).model_dump() for row in rows],
    }


@router.post("/paribasan/import", dependencies=[Depends(require_admin)])
def import_paribasan(payload: ParibasanBulkImport, db: Session = Depends(get_db)) -> dict:
    existing = {value.lower() for value in db.scalars(select(Paribasan.teks)).all()}
    created, skipped = 0, []
    for incoming in payload.items:
        key = incoming.teks.lower()
        if key in existing:
            skipped.append(incoming.teks)
            continue
        db.add(Paribasan(**incoming.model_dump()))
        existing.add(key)
        created += 1
    db.commit()
    return {"status": "success", "created": created, "skipped_duplicates": skipped}


@router.post("/kawruh", response_model=KawruhItem, dependencies=[Depends(require_admin)])
def create_kawruh(payload: KawruhCreate, db: Session = Depends(get_db)):
    item = KawruhBasa(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/kawruh/{item_id}", response_model=KawruhItem, dependencies=[Depends(require_admin)])
def update_kawruh(item_id: int, payload: KawruhUpdate, db: Session = Depends(get_db)):
    item = _get_or_404(db, KawruhBasa, item_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/kawruh/{item_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_kawruh(item_id: int, db: Session = Depends(get_db)) -> Response:
    db.delete(_get_or_404(db, KawruhBasa, item_id))
    db.commit()
    return Response(status_code=204)


@router.post("/paribasan", response_model=ParibasanItem, dependencies=[Depends(require_admin)])
def create_paribasan(payload: ParibasanCreate, db: Session = Depends(get_db)):
    item = Paribasan(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/paribasan/{item_id}", response_model=ParibasanItem, dependencies=[Depends(require_admin)])
def update_paribasan(item_id: int, payload: ParibasanUpdate, db: Session = Depends(get_db)):
    item = _get_or_404(db, Paribasan, item_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/paribasan/{item_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_paribasan(item_id: int, db: Session = Depends(get_db)) -> Response:
    db.delete(_get_or_404(db, Paribasan, item_id))
    db.commit()
    return Response(status_code=204)
