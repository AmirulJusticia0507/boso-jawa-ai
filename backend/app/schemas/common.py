"""Skema umum (respons error)."""

from typing import Any

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
    detail: Any | None = None
