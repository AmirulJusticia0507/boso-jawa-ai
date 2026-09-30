"""Schemas for protected content administration endpoints."""

from typing import Literal

from pydantic import BaseModel, Field

ContentStatus = Literal["draft", "review", "published"]


class KawruhCreate(BaseModel):
    ngoko: str = Field(..., min_length=1, max_length=100)
    krama_lugu: str | None = Field(default=None, max_length=100)
    krama_inggil: str | None = Field(default=None, max_length=100)
    bahasa_indonesia: str = Field(..., min_length=1, max_length=100)
    kelas_kata: str = Field(default="Tembung Aran", max_length=30)
    contoh_ukara: str | None = None
    status: ContentStatus = "draft"


class KawruhUpdate(BaseModel):
    ngoko: str | None = Field(default=None, min_length=1, max_length=100)
    krama_lugu: str | None = Field(default=None, max_length=100)
    krama_inggil: str | None = Field(default=None, max_length=100)
    bahasa_indonesia: str | None = Field(default=None, min_length=1, max_length=100)
    kelas_kata: str | None = Field(default=None, max_length=30)
    contoh_ukara: str | None = None
    status: ContentStatus | None = None


class ParibasanCreate(BaseModel):
    teks: str = Field(..., min_length=1)
    tegese: str = Field(..., min_length=1)
    kategori: str = Field(..., pattern="^(paribasan|bebasan|saloka)$")
    padanan_indonesia: str | None = None
    status: ContentStatus = "draft"


class ParibasanUpdate(BaseModel):
    teks: str | None = Field(default=None, min_length=1)
    tegese: str | None = Field(default=None, min_length=1)
    kategori: str | None = Field(default=None, pattern="^(paribasan|bebasan|saloka)$")
    padanan_indonesia: str | None = None
    status: ContentStatus | None = None


class KawruhBulkImport(BaseModel):
    items: list[KawruhCreate] = Field(..., min_length=1, max_length=500)


class ParibasanBulkImport(BaseModel):
    items: list[ParibasanCreate] = Field(..., min_length=1, max_length=500)
