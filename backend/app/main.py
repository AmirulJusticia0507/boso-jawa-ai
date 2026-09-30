"""Aplikasi FastAPI Boso Jawa AI System."""

import logging
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import engine
from app.core.logging import configure_logging
from app.core.middleware import SecurityHeadersMiddleware

configure_logging()
logger = logging.getLogger("boso_jawa.request")

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Sistem AI Kebahasaan Jawa: transliterasi aksara, kawruh basa, macapat, dan dataset LLM.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# Security headers (CSP, HSTS, nosniff, frame-ancestors, Permissions-Policy).
# Ditambahkan setelah CORS agar tetap dijalankan di lapisan terdalam.
app.add_middleware(SecurityHeadersMiddleware)


@app.middleware("http")
async def request_context(request: Request, call_next):
    incoming_id = request.headers.get("X-Request-ID", "").strip()
    request_id = incoming_id[:128] if incoming_id else str(uuid4())
    request.state.request_id = request_id
    started = perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception(
            "request_failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
            },
        )
        raise
    duration_ms = round((perf_counter() - started) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request_completed",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    return response


@app.get("/", tags=["root"])
def read_root() -> dict:
    return {"message": f"{settings.app_name} API", "docs": "/docs"}


@app.get("/health", tags=["root"])
def health_check() -> dict:
    return {"status": "ok"}


@app.get("/health/live", tags=["health"])
def health_live() -> dict:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
def health_ready() -> dict:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="Database belum siap.") from exc
    return {"status": "ready", "database": "ok"}


app.include_router(api_router, prefix=settings.api_v1_prefix)
