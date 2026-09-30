"""Endpoint AI: chat LLM via gateway OpenAI-compatible,
serta import/export dataset fine-tuning.
"""

import json
import logging
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from openai import APIConnectionError, APIStatusError, APITimeoutError, RateLimitError
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.endpoints.admin import AdminAuth, record_audit
from app.core.config import settings
from app.core.database import get_db
from app.models.ai_dataset import AITrainingDataset
from app.schemas.ai import (
    ChatRequest,
    ChatResponse,
    DatasetExportResponse,
    DatasetImportRequest,
    DatasetImportResult,
    DatasetVerifyRequest,
    ModelsResponse,
)
from app.services.ai_client import (
    AINotConfiguredError,
    chat_completion,
    list_models,
)
from app.services.dataset import (
    EXPORT_FORMATS,
    DatasetParseError,
    DatasetRow,
    dataset_stats,
    dedupe_rows,
    parse_dataset,
    to_csv,
    to_jsonl,
)
from app.services.rate_limiter import client_identifier, limiter
from app.services.knowledge import grounded_messages, retrieve_context

logger = logging.getLogger("boso_jawa.ai")

router = APIRouter()


def _gateway_error(e: Exception) -> HTTPException:
    if isinstance(e, AINotConfiguredError):
        return HTTPException(status_code=503, detail=str(e))
    if isinstance(e, APITimeoutError):
        return HTTPException(status_code=504, detail="Gateway AI tidak merespons tepat waktu.")
    if isinstance(e, RateLimitError):
        return HTTPException(status_code=429, detail="Gateway AI sedang membatasi permintaan.")
    if isinstance(e, (APIConnectionError, APIStatusError)):
        return HTTPException(status_code=502, detail="Gateway AI sedang bermasalah.")
    return HTTPException(status_code=502, detail="Tidak dapat memproses permintaan AI.")


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    limiter.check(
        f"ai:chat:{client_identifier(request)}",
        settings.ai_chat_rate_limit,
    )
    dumped_messages = [message.model_dump() for message in payload.messages]
    last_user_message = next(
        (message["content"] for message in reversed(dumped_messages) if message["role"] == "user"),
        "",
    )
    try:
        sources = retrieve_context(db, last_user_message)
    except SQLAlchemyError:
        sources = []
    messages = grounded_messages(dumped_messages, sources)
    try:
        model, answer = chat_completion(
            messages,
            model=payload.model,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
        )
    except Exception as e:  # noqa: BLE001 — dipetakan ke HTTP di bawah
        raise _gateway_error(e) from e
    return {
        "status": "success",
        "data": {"model": model, "answer": answer, "sources": sources},
    }


@router.get("/models", response_model=ModelsResponse)
def get_models(request: Request) -> dict:
    limiter.check(
        f"ai:models:{client_identifier(request)}",
        settings.ai_models_rate_limit,
    )
    try:
        models = list_models()
    except Exception as e:  # noqa: BLE001 — dipetakan ke HTTP di bawah
        raise _gateway_error(e) from e
    return {"status": "success", "data": models}


_EXPORT_MEDIA_TYPES = {
    "jsonl": "application/x-ndjson; charset=utf-8",
    "csv": "text/csv; charset=utf-8",
    "json": "application/json; charset=utf-8",
}


def _dataset_query(
    kategori: str | None,
    is_verified: bool | None,
    limit: int,
    offset: int,
):
    stmt = select(AITrainingDataset)
    if kategori:
        stmt = stmt.where(func.lower(AITrainingDataset.kategori) == kategori.strip().lower())
    if is_verified is not None:
        stmt = stmt.where(AITrainingDataset.is_verified.is_(is_verified))
    return stmt.order_by(AITrainingDataset.id).limit(limit).offset(offset)


@router.get(
    "/dataset/export",
    response_model=DatasetExportResponse,
    dependencies=[AdminAuth],
)
def export_dataset(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    format: str = Query(default="jsonl", alias="format"),
    kategori: str | None = Query(default=None, max_length=50),
    is_verified: bool | None = Query(default=None),
    limit: int = Query(default=1_000, ge=1, le=10_000),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """Ekspor dataset fine-tuning sebagai JSONL, CSV, atau JSON.

    Format JSONL adalah format kanonik untuk fine-tuning; `format=csv` untuk
    inspeksi manual, `format=json` untuk integrasi tooling.
    """
    limiter.check(f"ai:dataset:export:{client_identifier(request)}", settings.ai_models_rate_limit)
    if format not in EXPORT_FORMATS:
        raise HTTPException(
            status_code=422,
            detail=f"Format tidak didukung. Pilihan: {', '.join(EXPORT_FORMATS)}.",
        )

    rows = db.scalars(_dataset_query(kategori, is_verified, limit, offset)).all()
    payload = [
        {
            "id": row.id,
            "prompt": row.prompt,
            "completion": row.completion,
            "kategori": row.kategori,
            "is_verified": row.is_verified,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]
    summary = dataset_stats(rows)

    if format == "jsonl":
        content = to_jsonl(payload)
    elif format == "csv":
        content = to_csv(payload)
    else:
        content = json.dumps(payload, ensure_ascii=False, indent=2)

    record_audit(
        db,
        request,
        action="ai_dataset.export",
        target_table="ai_training_dataset",
        changes={"format": format, "kategori": kategori, "count": summary["total"]},
        commit=True,
    )

    stem = f"ai-dataset-{summary['total']}-baris"
    response.headers["Content-Disposition"] = (
        f"attachment; filename=\"{stem}.{format}\""
    )
    response.headers["X-Dataset-Count"] = str(summary["total"])
    response.headers["X-Dataset-Verified"] = str(summary["verified"])
    return {
        "status": "success",
        "data": {
            "format": format,
            "count": summary["total"],
            "verified": summary["verified"],
            "per_kategori": summary["per_kategori"],
            "content": content,
        },
    }


@router.get("/dataset/export/download", dependencies=[AdminAuth])
def download_dataset(
    request: Request,
    db: Session = Depends(get_db),
    format: str = Query(default="jsonl", alias="format"),
    kategori: str | None = Query(default=None, max_length=50),
    is_verified: bool | None = Query(default=None),
    limit: int = Query(default=10_000, ge=1, le=50_000),
) -> Response:
    """Versi streaming/mentah dari ekspor: body langsung berisi file dataset."""
    limiter.check(f"ai:dataset:export:{client_identifier(request)}", settings.ai_models_rate_limit)
    if format not in EXPORT_FORMATS:
        raise HTTPException(
            status_code=422,
            detail=f"Format tidak didukung. Pilihan: {', '.join(EXPORT_FORMATS)}.",
        )

    rows = db.scalars(_dataset_query(kategori, is_verified, limit, 0)).all()
    payload = [
        {
            "id": row.id,
            "prompt": row.prompt,
            "completion": row.completion,
            "kategori": row.kategori,
            "is_verified": row.is_verified,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]

    if format == "jsonl":
        body = to_jsonl(payload)
    elif format == "csv":
        body = to_csv(payload)
    else:
        body = json.dumps(payload, ensure_ascii=False, indent=2)

    record_audit(
        db,
        request,
        action="ai_dataset.download",
        target_table="ai_training_dataset",
        changes={"format": format, "kategori": kategori, "count": len(payload)},
        commit=True,
    )

    filename = f"ai-dataset.{format}"
    return Response(
        content=body,
        media_type=_EXPORT_MEDIA_TYPES[format],
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}",
            "X-Dataset-Count": str(len(payload)),
            "Cache-Control": "no-store",
        },
    )


@router.get("/dataset/stats", dependencies=[AdminAuth])
def dataset_overview(request: Request, db: Session = Depends(get_db)) -> dict:
    """Ringkasan dataset: total, rasio terverifikasi, dan sebaran kategori."""
    limiter.check(f"ai:dataset:stats:{client_identifier(request)}", settings.ai_models_rate_limit)
    total = db.scalar(select(func.count()).select_from(AITrainingDataset)) or 0
    verified = (
        db.scalar(
            select(func.count())
            .select_from(AITrainingDataset)
            .where(AITrainingDataset.is_verified.is_(True))
        )
        or 0
    )
    per_kategori = {
        kategori: count
        for kategori, count in db.execute(
            select(AITrainingDataset.kategori, func.count())
            .group_by(AITrainingDataset.kategori)
            .order_by(func.count().desc())
        ).all()
    }
    record_audit(
        db,
        request,
        action="ai_dataset.stats",
        target_table="ai_training_dataset",
        changes={"total": total},
        commit=True,
    )
    return {
        "status": "success",
        "data": {
            "total": total,
            "verified": verified,
            "unverified": total - verified,
            "verified_ratio": round(verified / total, 4) if total else 0.0,
            "per_kategori": per_kategori,
        },
    }


@router.post(
    "/dataset/import",
    response_model=DatasetImportResult,
    dependencies=[AdminAuth],
)
def import_dataset(
    payload: DatasetImportRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    """Impor dataset fine-tuning dari JSON, JSONL, atau CSV.

    Validasi per-baris bersifat non-fatal: baris yang tidak valid dikembalikan
    di `errors` bersama nomor baris sumber, sementara baris yang sah tetap
    disimpan. Gunakan `?strict=true` untuk membatalkan seluruh impor bila ada
    satu saja baris gagal.
    """
    limiter.check(f"ai:dataset:import:{client_identifier(request)}", settings.ai_models_rate_limit)
    strict = request.query_params.get("strict", "").lower() in {"1", "true", "ya"}

    source: object = payload.items if payload.items is not None else payload.raw
    try:
        parsed = parse_dataset(source, payload.content_type)
    except DatasetParseError as exc:
        raise HTTPException(
            status_code=422,
            detail={"message": "Dataset tidak bisa dibaca.", "errors": [e.model_dump() for e in exc.errors]},
        ) from exc

    if strict and parsed.error_count:
        raise HTTPException(
            status_code=422,
            detail={
                "message": f"{parsed.error_count} baris tidak valid; impor dibatalkan (strict).",
                "errors": [e.model_dump() for e in parsed.errors],
            },
        )
    if not parsed.rows:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Tidak ada baris valid untuk disimpan.",
                "errors": [e.model_dump() for e in parsed.errors],
            },
        )

    unique, duplicates = dedupe_rows(parsed.rows)

    created, updated, skipped_existing = _persist_rows(
        db,
        unique,
        mode=payload.mode,
        mark_verified=payload.mark_verified,
    )
    record_audit(
        db,
        request,
        action="ai_dataset.import",
        target_table="ai_training_dataset",
        changes={
            "received": parsed.total_seen,
            "created": created,
            "updated": updated,
            "mode": payload.mode,
        },
    )
    db.commit()

    logger.info(
        "dataset_imported",
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "received": parsed.total_seen,
            "created": created,
            "updated": updated,
            "skipped_in_payload": len(duplicates),
            "skipped_existing": skipped_existing,
            "failed": parsed.error_count,
        },
    )
    return {
        "status": "success",
        "data": {
            "received": parsed.total_seen,
            "created": created,
            "updated": updated,
            "skipped_duplicate_in_payload": len(duplicates),
            "skipped_existing": skipped_existing,
            "errors": [e.model_dump() for e in parsed.errors],
        },
    }


def _existing_fingerprints(db: Session, rows: list[DatasetRow]) -> dict[tuple[str, str], AITrainingDataset]:
    """Cari baris yang sudah ada agar import idempoten.

    Dicocokkan pada (kategori, prompt) — pasangan itu yang menentukan apakah
    sebuah baris benar-benar baru.
    """
    if not rows:
        return {}
    found: dict[tuple[str, str], AITrainingDataset] = {}
    chunk_size = 500
    for start in range(0, len(rows), chunk_size):
        chunk = rows[start : start + chunk_size]
        prompts = [row.prompt for row in chunk]
        stmt = select(AITrainingDataset).where(AITrainingDataset.prompt.in_(prompts))
        for existing in db.scalars(stmt):
            key = (
                existing.kategori.strip().lower(),
                " ".join(existing.prompt.split()).lower(),
            )
            found[key] = existing
    return found


def _persist_rows(
    db: Session,
    rows: list[DatasetRow],
    *,
    mode: str,
    mark_verified: bool,
) -> tuple[int, int, int]:
    """Simpan baris hasil parsing. Mengembalikan (created, updated, skipped)."""
    existing = _existing_fingerprints(db, rows)
    created = updated = skipped = 0
    for row in rows:
        key = (row.kategori.strip().lower(), " ".join(row.prompt.split()).lower())
        match = existing.get(key)
        if match is None:
            db.add(
                AITrainingDataset(
                    prompt=row.prompt,
                    completion=row.completion,
                    kategori=row.kategori,
                    is_verified=row.is_verified or mark_verified,
                )
            )
            created += 1
            continue
        if mode == "upsert":
            match.completion = row.completion
            match.kategori = row.kategori
            if mark_verified:
                match.is_verified = True
            updated += 1
        else:
            skipped += 1
    return created, updated, skipped


@router.patch("/dataset/{item_id}", dependencies=[AdminAuth])
def verify_dataset_item(
    item_id: int,
    payload: DatasetVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    """Tandai satu baris dataset sebagai terverifikasi (atau belum)."""
    row = db.get(AITrainingDataset, item_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Baris dataset tidak ditemukan.")
    previous = row.is_verified
    row.is_verified = payload.is_verified
    record_audit(
        db,
        request,
        action="ai_dataset.verify",
        target_table="ai_training_dataset",
        target_id=row.id,
        changes={"is_verified": {"from": previous, "to": row.is_verified}, "note": payload.note},
    )
    db.commit()
    db.refresh(row)
    return {
        "status": "success",
        "data": {
            "id": row.id,
            "prompt": row.prompt,
            "completion": row.completion,
            "kategori": row.kategori,
            "is_verified": row.is_verified,
            "note": payload.note,
        },
    }
