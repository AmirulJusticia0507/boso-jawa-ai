"""Skema endpoint pencarian kawruh basa."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class KawruhItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ngoko: str
    krama_lugu: str | None = None
    krama_inggil: str | None = None
    bahasa_indonesia: str
    kelas_kata: str | None = None
    contoh_ukara: str | None = None


class KawruhSearchResponse(BaseModel):
    status: str = "success"
    total: int
    page: int
    limit: int
    has_next: bool
    data: list[KawruhItem]


class CorrectionRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2_000)
    target_level: Literal["ngoko", "krama_lugu", "krama_inggil"]


class WordChange(BaseModel):
    original: str
    replacement: str
    source_level: str
    target_level: str
    meaning: str


class CorrectionResponse(BaseModel):
    status: str = "success"
    original: str
    corrected: str
    target_level: str
    changes: list[WordChange]
    note: str
