"""Protected CRUD endpoints for language content, dengan audit trail admin."""

import hashlib
import json
import logging
import secrets
from datetime import datetime
from typing import Any, Callable, Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.auth import decode_token
from app.core.config import settings
from app.core.database import get_db
from app.core.observability import capture_exception
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


async def _get_current_user_from_jwt(request: Request, db: Session) -> Optional[dict]:
    """Try to get user from JWT Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    username = payload.get("sub")
    if not username:
        return None
    from app.models.admin_user import AdminUser
    user = db.scalar(select(AdminUser).where(AdminUser.username == username))
    if not user or not user.is_active:
        return None
    return {"username": user.username, "role": user.role.value, "user_id": user.id}


def _get_role_from_api_key(x_admin_key: str | None) -> Optional[str]:
    """Legacy: get role from shared API key (for backward compatibility)."""
    if not x_admin_key:
        return None
    configured = {
        "admin": settings.admin_api_key,
        "editor": settings.editor_api_key,
        "reviewer": settings.reviewer_api_key,
    }
    return next(
        (name for name, key in configured.items() if key and secrets.compare_digest(x_admin_key, key)),
        None,
    )


async def require_admin(
    request: Request,
    db: Session = Depends(get_db),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> str:
    """
    Validasi autentikasi admin: coba JWT dulu, lalu fallback ke API key lama.
    Set request.state.admin_fingerprint, admin_role, admin_user_id.
    """
    # Try JWT first
    jwt_user = await _get_current_user_from_jwt(request, db)
    if jwt_user:
        request.state.admin_fingerprint = f"jwt_{jwt_user['username']}"
        request.state.admin_role = jwt_user["role"]
        request.state.admin_user_id = jwt_user["user_id"]
        return "jwt"

    # Fallback to legacy API key
    role = _get_role_from_api_key(x_admin_key)
    if role is None:
        _log_denied(request, x_admin_key)
        raise HTTPException(status_code=401, detail="Autentikasi diperlukan. Gunakan Bearer token atau X-Admin-Key.")
    request.state.admin_fingerprint = _fingerprint(x_admin_key)
    request.state.admin_role = role
    return "api_key"


AdminAuth = Depends(require_admin)

Role = Literal["admin", "editor", "reviewer"]
ROLE_PERMISSIONS: dict[Role, frozenset[str]] = {
    "admin": frozenset({"content.read", "content.write", "content.review", "content.delete", "dataset.read", "dataset.write", "dataset.verify", "audit.read"}),
    "editor": frozenset({"content.read", "content.write", "dataset.read", "dataset.write"}),
    "reviewer": frozenset({"content.read", "content.review", "dataset.read", "dataset.verify"}),
}


def require_permission(permission: str) -> Callable:
    async def dependency(request: Request, _key: str = Depends(require_admin)) -> str:
        role: Role = getattr(request.state, "admin_role", "admin")
        if permission not in ROLE_PERMISSIONS[role]:
            raise HTTPException(status_code=403, detail=f"Role {role} tidak memiliki permission {permission}.")
        return role

    return dependency


def Permission(permission: str) -> Depends:
    return Depends(require_permission(permission))


def require_any_permission(*permissions: str) -> Callable:
    async def dependency(request: Request, _key: str = Depends(require_admin)) -> str:
        role: Role = getattr(request.state, "admin_role", "admin")
        if ROLE_PERMISSIONS[role].isdisjoint(permissions):
            raise HTTPException(status_code=403, detail=f"Role {role} tidak memiliki permission yang diperlukan.")
        return role

    return dependency


def _actor(request: Request) -> str:
    """Get actor identifier for audit logging."""
    # Prefer JWT user_id, then fingerprint
    if hasattr(request.state, "admin_user_id"):
        return f"user:{request.state.admin_user_id}"
    return getattr(request.state, "admin_fingerprint", "unknown")


@router.get("/session", dependencies=[AdminAuth])
def admin_session(request: Request) -> dict:
    role: Role = getattr(request.state, "admin_role", "admin")
    return {"status": "success", "data": {"role": role, "permissions": sorted(ROLE_PERMISSIONS[role])}}


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
    commit: bool = False,
) -> None:
    """Catat satu aksi admin ke tabel audit_log.

    ``commit=False`` (default) sengaja memakai session yang sama dan ``flush``
    supaya entri audit ikut transaksi: kalau aksi utama rollback, jejaknya juga
    hilang. Aksi read-only tidak punya transaksi lain untuk commit, jadi
    pemanggilnya harus mengoper ``commit=True``.
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
    if commit:
        db.commit()
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


@router.get("/stats", dependencies=[Permission("content.read")])
def stats(request: Request, db: Session = Depends(get_db)) -> dict:
    payload = {
        "kawruh": db.scalar(select(func.count()).select_from(KawruhBasa)) or 0,
        "paribasan": db.scalar(select(func.count()).select_from(Paribasan)) or 0,
        "audit_log": db.scalar(select(func.count()).select_from(AuditLog)) or 0,
    }
    # Dicatat setelah dibaca supaya jumlah audit_log tidak menghitung aksi ini.
    record_audit(db, request, action="stats.view", target_table="-", commit=True)
    return {"status": "success", "data": payload}


@router.get("/audit-logs", response_model=AuditLogPage, dependencies=[Permission("audit.read")])
def list_audit_logs(
    request: Request,
    db: Session = Depends(get_db),
    action: str | None = Query(default=None, max_length=100),
    target_table: str | None = Query(default=None, max_length=50),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """Baca jejak audit admin, terbaru dulu."""
    stmt = select(AuditLog)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if target_table:
        stmt = stmt.where(AuditLog.target_table == target_table)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(stmt.order_by(AuditLog.id.desc()).limit(limit).offset(offset)).all()
    payload = {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [AuditLogItem.model_validate(row).model_dump() for row in rows],
    }
    # Dicatat setelah dibaca supaya aksi "lihat log" tidak muncul di halamannya sendiri.
    record_audit(db, request, action="audit_log.view", target_table="audit_log", commit=True)
    return {"status": "success", "data": payload}


# --- Kawruh list with pagination, filter, search ---

@router.get("/kawruh", dependencies=[Permission("content.read")])
def list_kawruh(
    request: Request,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, description="Filter status: draft, review, published"),
    q: str | None = Query(None, min_length=1, description="Pencarian pada ngoko, krama, indonesia"),
    include_deleted: bool = Query(False, description="Sertakan data yang sudah dihapus (soft delete)"),
) -> dict:
    """Daftar Kawruh Basa dengan pagination, filter status, dan pencarian."""
    stmt = select(KawruhBasa)

    if not include_deleted:
        stmt = stmt.where(KawruhBasa.deleted_at.is_(None))

    if status:
        stmt = stmt.where(KawruhBasa.status == status)

    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            or_(
                KawruhBasa.ngoko.ilike(pattern),
                KawruhBasa.krama_lugu.ilike(pattern),
                KawruhBasa.krama_inggil.ilike(pattern),
                KawruhBasa.bahasa_indonesia.ilike(pattern),
            )
        )

    stmt = stmt.order_by(KawruhBasa.id)
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = db.scalars(stmt.offset((page - 1) * limit).limit(limit)).all()

    record_audit(
        db,
        request,
        action="kawruh.list",
        target_table="kawruh",
        changes={"page": page, "limit": limit, "status": status, "q": q, "include_deleted": include_deleted},
        commit=True,
    )

    return {
        "status": "success",
        "total": total,
        "page": page,
        "limit": limit,
        "has_next": page * limit < total,
        "data": [KawruhItem.model_validate(row).model_dump() for row in rows],
    }


@router.get("/kawruh/export", dependencies=[Permission("content.read")])
def export_kawruh(request: Request, db: Session = Depends(get_db)) -> dict:
    rows = db.scalars(select(KawruhBasa).order_by(KawruhBasa.id)).all()
    record_audit(
        db,
        request,
        action="kawruh.export",
        target_table="kawruh",
        changes={"count": len(rows)},
        commit=True,
    )
    return {
        "status": "success",
        "data": [KawruhItem.model_validate(row).model_dump() for row in rows],
    }


@router.post("/kawruh/import", dependencies=[Permission("content.write")])
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


@router.post("/kawruh", response_model=KawruhItem, dependencies=[Permission("content.write")])
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


@router.put("/kawruh/{item_id}", response_model=KawruhItem)
def update_kawruh(
    item_id: int,
    payload: KawruhUpdate,
    request: Request,
    db: Session = Depends(get_db),
    role: Role = Depends(require_any_permission("content.write", "content.review")),
):
    if role == "reviewer" and set(payload.model_fields_set) - {"status"}:
        raise HTTPException(status_code=403, detail="Reviewer hanya boleh mengubah status konten.")
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


# Soft delete: set deleted_at instead of hard delete
@router.delete("/kawruh/{item_id}", status_code=200, dependencies=[Permission("content.delete")])
def delete_kawruh(
    item_id: int,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete Kawruh Basa (set deleted_at)."""
    item = _get_or_404(db, KawruhBasa, item_id)
    snapshot = {
        "ngoko": item.ngoko,
        "status": getattr(item, "status", None),
        "deleted_at": datetime.utcnow().isoformat(),
    }
    item.deleted_at = datetime.utcnow()
    record_audit(
        db,
        request,
        action="kawruh.soft_delete",
        target_table="kawruh",
        target_id=item_id,
        changes=snapshot,
    )
    db.commit()
    return {"status": "success", "message": "Data dipindahkan ke sampah", "id": item_id}


# Restore soft-deleted item
@router.post("/kawruh/{item_id}/restore", response_model=KawruhItem, dependencies=[Permission("content.delete")])
def restore_kawruh(
    item_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Pulihkan Kawruh Basa yang sudah di-soft-delete."""
    item = _get_or_404(db, KawruhBasa, item_id)
    if item.deleted_at is None:
        raise HTTPException(status_code=400, detail="Data tidak dalam kondisi terhapus.")
    item.deleted_at = None
    record_audit(
        db,
        request,
        action="kawruh.restore",
        target_table="kawruh",
        target_id=item_id,
        changes={"restored_at": datetime.utcnow().isoformat()},
    )
    db.commit()
    db.refresh(item)
    return item


# --- Paribasan list with pagination, filter, search ---

@router.get("/paribasan", dependencies=[Permission("content.read")])
def list_paribasan(
    request: Request,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, description="Filter status: draft, review, published"),
    kategori: str | None = Query(None, description="Filter kategori: paribasan, bebasan, saloka"),
    q: str | None = Query(None, min_length=1, description="Pencarian pada teks, tegese, padanan_indonesia"),
    include_deleted: bool = Query(False, description="Sertakan data yang sudah dihapus (soft delete)"),
) -> dict:
    """Daftar Paribasan dengan pagination, filter status/kategori, dan pencarian."""
    stmt = select(Paribasan)

    if not include_deleted:
        stmt = stmt.where(Paribasan.deleted_at.is_(None))

    if status:
        stmt = stmt.where(Paribasan.status == status)

    if kategori:
        stmt = stmt.where(Paribasan.kategori == kategori)

    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            or_(
                Paribasan.teks.ilike(pattern),
                Paribasan.tegese.ilike(pattern),
                Paribasan.padanan_indonesia.ilike(pattern),
            )
        )

    stmt = stmt.order_by(Paribasan.id)
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = db.scalars(stmt.offset((page - 1) * limit).limit(limit)).all()

    record_audit(
        db,
        request,
        action="paribasan.list",
        target_table="paribasan",
        changes={"page": page, "limit": limit, "status": status, "kategori": kategori, "q": q, "include_deleted": include_deleted},
        commit=True,
    )

    return {
        "status": "success",
        "total": total,
        "page": page,
        "limit": limit,
        "has_next": page * limit < total,
        "data": [ParibasanItem.model_validate(row).model_dump() for row in rows],
    }


@router.get("/paribasan/export", dependencies=[Permission("content.read")])
def export_paribasan(request: Request, db: Session = Depends(get_db)) -> dict:
    rows = db.scalars(select(Paribasan).order_by(Paribasan.id)).all()
    record_audit(
        db,
        request,
        action="paribasan.export",
        target_table="paribasan",
        changes={"count": len(rows)},
        commit=True,
    )
    return {
        "status": "success",
        "data": [ParibasanItem.model_validate(row).model_dump() for row in rows],
    }


@router.post("/paribasan/import", dependencies=[Permission("content.write")])
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


@router.post("/paribasan", response_model=ParibasanItem, dependencies=[Permission("content.write")])
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


@router.put("/paribasan/{item_id}", response_model=ParibasanItem)
def update_paribasan(
    item_id: int,
    payload: ParibasanUpdate,
    request: Request,
    db: Session = Depends(get_db),
    role: Role = Depends(require_any_permission("content.write", "content.review")),
):
    if role == "reviewer" and set(payload.model_fields_set) - {"status"}:
        raise HTTPException(status_code=403, detail="Reviewer hanya boleh mengubah status konten.")
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


# Soft delete: set deleted_at instead of hard delete
@router.delete("/paribasan/{item_id}", status_code=200, dependencies=[Permission("content.delete")])
def delete_paribasan(
    item_id: int,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete Paribasan (set deleted_at)."""
    item = _get_or_404(db, Paribasan, item_id)
    snapshot = {
        "teks": item.teks,
        "kategori": item.kategori,
        "deleted_at": datetime.utcnow().isoformat(),
    }
    item.deleted_at = datetime.utcnow()
    record_audit(
        db,
        request,
        action="paribasan.soft_delete",
        target_table="paribasan",
        target_id=item_id,
        changes=snapshot,
    )
    db.commit()
    return {"status": "success", "message": "Data dipindahkan ke sampah", "id": item_id}


# Restore soft-deleted item
@router.post("/paribasan/{item_id}/restore", response_model=ParibasanItem, dependencies=[Permission("content.delete")])
def restore_paribasan(
    item_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Pulihkan Paribasan yang sudah di-soft-delete."""
    item = _get_or_404(db, Paribasan, item_id)
    if item.deleted_at is None:
        raise HTTPException(status_code=400, detail="Data tidak dalam kondisi terhapus.")
    item.deleted_at = None
    record_audit(
        db,
        request,
        action="paribasan.restore",
        target_table="paribasan",
        target_id=item_id,
        changes={"restored_at": datetime.utcnow().isoformat()},
    )
    db.commit()
    db.refresh(item)
    return item
