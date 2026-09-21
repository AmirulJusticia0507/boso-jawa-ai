"""Skema endpoint transliterasi aksara."""

from typing import Literal

from pydantic import BaseModel, Field

Direction = Literal["latin_to_aksara", "aksara_to_latin"]


class TransliterateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Teks sumber sesuai direction")
    direction: Direction = "latin_to_aksara"
    include_sandhangan: bool = True


class TransliterateData(BaseModel):
    original: str
    aksara: str | None = None
    latin: str | None = None
    rules_applied: list[str] = []


class TransliterateResponse(BaseModel):
    status: str = "success"
    data: TransliterateData
