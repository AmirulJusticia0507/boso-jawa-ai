"""Agregator router API v1."""

from fastapi import APIRouter

from app.api.v1.endpoints import ai, aksara, kawruh, macapat, paribasan

api_router = APIRouter()
api_router.include_router(aksara.router, prefix="/aksara", tags=["aksara"])
api_router.include_router(kawruh.router, prefix="/kawruh", tags=["kawruh"])
api_router.include_router(paribasan.router, prefix="/paribasan", tags=["paribasan"])
api_router.include_router(macapat.router, prefix="/macapat", tags=["macapat"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
