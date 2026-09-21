"""Entry point serverless untuk deploy backend di Vercel (@vercel/python).

Vercel mengeksekusi `handler(event, context)` untuk setiap request HTTP.
Semua path otomatis diprefix /api/v1 agar sesuai dengan FastAPI router.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from mangum import Mangum  # noqa: E402

from app.main import app  # noqa: E402

_original_handler = Mangum(app)


def handler(event: dict, context: dict) -> dict:
    """Tambahkan prefix /api/v1 jika path belum punya."""
    path = event.get("rawPath") or event.get("path") or ""
    if not path.startswith("/api/v1"):
        event["rawPath"] = "/api/v1" + path
        event["path"] = "/api/v1" + path
    return _original_handler(event, context)
