"""Aplikasi FastAPI Boso Jawa AI System."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings

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
)


@app.get("/", tags=["root"])
def read_root() -> dict:
    return {"message": f"{settings.app_name} API", "docs": "/docs"}


@app.get("/health", tags=["root"])
def health_check() -> dict:
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.api_v1_prefix)
