"""Entry point serverless untuk deploy backend di Vercel (@vercel/python).

Vercel mengeksekusi `handler(event, context)` untuk setiap request HTTP.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from mangum import Mangum  # noqa: E402

from app.main import app  # noqa: E402

handler = Mangum(app)
