"""Protected CRUD endpoints for language content, dengan audit trail admin."""

import hashlib
import json
import logging
import secrets
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.audit_log import AuditLog
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
from app.schemas.audit import AuditLogItem, AuditLogPage
from app.schemas.kawruh import KawruhItem
from app.schemas.paribasan import ParibasanItem
from app.services.rate_limiter import client_identifier

logger = logging.getLogger("boso_jawa.audit")

router = APIRouter()

#: Aksi yang tidak mengubah data tetap dicatat, tetapi tidak menyimpan payload.
_SENSITIVE_FIELDS = frozenset({"admin_key", "password", "api_key", "token"})


def _fingerprint(admin_key: str) -> str:
    """Simpan sidik jari kunci admin, bukan kunci mentahnya."""
    return hashlib.sha256(admin_key.encode("utf-8")).hexdigest()[:16]


def require_admin(
    request: Request,
    x_admin_key: str | None = Header(default=None),
) -> str:
    """Validasi kunci admin dan simpan sidik jarinya di request.state."""
    if not settings.admin_api_key:
        raise HTTPException(status_code=503, detail="Admin API belum dikonfigurasi.")
    if x_admin_key is None or not secrets.compare_digest(x_admin_key, settings.admin_api_key):
        _log_denied(request, x_admin_key)
        raise HTTPException(status_code=401, detail="Kunci admin tidak valid.")
    request.state.admin_fingerprint = _fingerprint(x_admin_key)
    return x_admin_key


AdminAuth = Depends(require_admin)


def _actor(request: Request) -> str:
    return getattr(request.state, "admin_fingerprint", "unknown")


def _log_denied(request: Request, presented_key: str | None) -> None:
    """Catat percobaan akses admin yang gagal ke logger (bukan ke DB)."""
    logger.warning(
        "admin_auth_failed",
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "method": request.method,
            "path": request.url.path,
            "ip": client_identifier(request),
            "key_hint": _fingerprint(presented_key) if presented_key else "none",
        },
    )


def _redact(payload: dict[str, Any]) -> dict[str, Any]:
    return {k: ("[redacted]" if k.lower() in _SENSITIVE_FIELDS else v) for k, v in payload.items()}


def record_audit(
    db: Session,
    request: Request,
    *,
    action: str,
    target_table: str,
    target_id: int | None = None,
    changes: dict[str, Any] | None = None,
) -> None:
    """Catat satu aksi admin ke tabel audit_log.

    Sengaja memakai session yang sama dan ``flush`` (bukan ``commit``) supaya
    entri audit ikut transaksi: kalau aksi utama rollback, jejaknya juga hilang.
    """
    entry = AuditLog(
        admin_key_fingerprint=_actor(request),
        action=action,
        target_table=target_table,
        target_id=target_id,
        changes=json.dumps(_redact(changes), ensure_ascii=False) if changes else None,
        ip_address=client_identifier(request),
        user_agent=(request.headers.get("user-agent") or "")[:500] or None,
        request_id=getattr(request.state, "request_id", None),
    )
    db.add(entry)
    db.flush()
    logger.info(
        "admin_action",
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "action": action,
            "target_table": target_table,
            "target_id": target_id,
            "admin": entry.admin_key_fingerprint,
            "ip": entry.ip_address,
        },
    )


def _get_or_404(db: Session, model, item_id: int):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan.")
    return item


@router.get("/stats", dependencies=[AdminAuth])
def stats(request: Request, db: Session = Depends(get_db)) -> dict:
    record_audit(db, request, action="stats.view", target_table="-")
    return {
        "status": "success",
        "data": {
            "kawruh": db.scalar(select(func.count()).select_from(KawruhBasa)) or 0,
            "paribasan": db.scalar(select(func.count()).select_from(Paribasan)) or 0,
            "audit_log": db.scalar(select(func.count()).select_from(AuditLog)) or 0,
        },
    }


@router.get("/audit-logs", response_model=AuditLogPage, dependencies=[AdminAuth])
def list_audit_logs(
    request: Request,
    db: Session = Depends(get_db),
    action: str | None = Query(default=None, max_length=100),
    target_table: str | None = Query(default=None, max_length=50),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """Baca jejak audit admin, terbaru dulu."""
    record_audit(db, request, action="audit_log.view", target_table="audit_log")

    stmt = select(AuditLog)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if target_table:
        stmt = stmt.where(AuditLog.target_table == target_table)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(stmt.order_by(AuditLog.id.desc()).limit(limit).offset(offset)).all()
    return {
        "status": "success",
        "data": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": [AuditLogItem.model_validate(row).model_dump() for row in rows],
        },
    }


@router.get("/kawruh/export", dependencies=[AdminAuth])
def export_kawruh(request: Request, db: Session = Depends(get_db)) -> dict:
    rows = db.scalars(select(KawruhBasa).order_by(KawruhBasa.id)).all()
    record_audit(
        db,
        request,
        action="kawruh.export",
        target_table="kawruh",
        changes={"count": len(rows)},
    )
    return {
        "status": "success",
        "data": [KawruhItem.model_validate(row).model_dump() for row in rows],
    }


@router.post("/kawruh/import", dependencies=[AdminAuth])
def import_kawruh(
    payload: KawruhBulkImport,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    existing = {value.lower() for value in db.scalars(select(KawruhBasa.ngoko)).all()}
    created, skipped, created_ids = 0, [], []
    for incoming in payload.items:
        key = incoming.ngoko.lower()
        if key in existing:
            skipped.append(incoming.ngoko)
            continue
        row = KawruhBasa(**incoming.model_dump())
        db.add(row)
        db.flush()
        created_ids.append(row.id)
        existing.add(key)
        created += 1
    record_audit(
        db,
        request,
        action="kawruh.import",
        target_table="kawruh",
        changes={"created": created, "skipped": len(skipped), "ids": created_ids},
    )
    db.commit()
    return {"status": "success", "created": created, "skipped_duplicates": skipped}


@router.get("/paribasan/export", dependencies=[AdminAuth])
def export_paribasan(request: Request, db: Session = Depends(get_db)) -> dict:
    rows = db.scalars(select(Paribasan).order_by(Paribasan.id)).all()
    record_audit(
        db,
        request,
        action="paribasan.export",
        target_table="paribasan",
        changes={"count": len(rows)},
    )
    return {
        "status": "success",
        "data": [ParibasanItem.model_validate(row).model_dump() for row in rows],
    }


@router.post("/paribasan/import", dependencies=[AdminAuth])
def import_paribasan(
    payload: ParibasanBulkImport,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    existing = {value.lower() for value in db.scalars(select(Paribasan.teks)).all()}
    created, skipped, created_ids = 0, [], []
    for incoming in payload.items:
        key = incoming.teks.lower()
        if key in existing:
            skipped.append(incoming.teks)
            continue
        row = Paribasan(**incoming.model_dump())
        db.add(row)
        db.flush()
        created_ids.append(row.id)
        existing.add(key)
        created += 1
    record_audit(
        db,
        request,
        action="paribasan.import",
        target_table="paribasan",
        changes={"created": created, "skipped": len(skipped), "ids": created_ids},
    )
    db.commit()
    return {"status": "success", "created": created, "skipped_duplicates": skipped}


@router.post("/kawruh", response_model=KawruhItem, dependencies=[AdminAuth])
def create_kawruh(
    payload: KawruhCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    item = KawruhBasa(**payload.model_dump())
    db.add(item)
    db.flush()
    record_audit(
        db,
        request,
        action="kawruh.create",
        target_table="kawruh",
        target_id=item.id,
        changes=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/kawruh/{item_id}", response_model=KawruhItem, dependencies=[AdminAuth])
def update_kawruh(
    item_id: int,
    payload: KawruhUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    item = _get_or_404(db, KawruhBasa, item_id)
    changes: dict[str, Any] = {}
    for field, value in payload.model_dump(exclude_unset=True).items():
        before = getattr(item, field)
        if before != value:
            changes[field] = {"from": before, "to": value}
        setattr(item, field, value)
    record_audit(
        db,
        request,
        action="kawruh.update",
        target_table="kawruh",
        target_id=item_id,
        changes=changes or None,
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/kawruh/{item_id}", status_code=204, dependencies=[AdminAuth])
def delete_kawruh(
    item_id: int,
    request: Request,
    db: Session = Depends(get_db),
) -> Response:
    item = _get_or_404(db, KawruhBasa, item_id)
    snapshot = {"ngoko": item.ngoko, "status": getattr(item, "status", None)}
    db.delete(item)
    record_audit(
        db,
        request,
        action="kawruh.delete",
        target_table="kawruh",
        target_id=item_id,
        changes=snapshot,
    )
    db.commit()
    return Response(status_code=204)


@router.post("/paribasan", response_model=ParibasanItem, dependencies=[AdminAuth])
def create_paribasan(
    payload: ParibasanCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    item = Paribasan(**payload.model_dump())
    db.add(item)
    db.flush()
    record_audit(
        db,
        request,
        action="paribasan.create",
        target_table="paribasan",
        target_id=item.id,
        changes=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/paribasan/{item_id}", response_model=ParibasanItem, dependencies=[AdminAuth])
def update_paribasan(
    item_id: int,
    payload: ParibasanUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    item = _get_or_404(db, Paribasan, item_id)
    changes: dict[str, Any] = {}
    for field, value in payload.model_dump(exclude_unset=True).items():
        before = getattr(item, field)
        if before != value:
            changes[field] = {"from": before, "to": value}
        setattr(item, field, value)
    record_audit(
        db,
        request,
        action="paribasan.update",
        target_table="paribasan",
        target_id=item_id,
        changes=changes or None,
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/paribasan/{item_id}", status_code=204, dependencies=[AdminAuth])
def delete_paribasan(
    item_id: int,
    request: Request,
    db: Session = Depends(get_db),
) -> Response:
    item = _get_or_404(db, Paribasan, item_id)
    snapshot = {"teks": item.teks, "kategori": item.kategori}
    db.delete(item)
    record_audit(
        db,
        request,
        action="paribasan.delete",
        target_table="paribasan",
        target_id=item_id,
        changes=snapshot,
    )
    db.commit()
    return Response(status_code=204)
