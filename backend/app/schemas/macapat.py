"""Skema endpoint validasi macapat."""

from pydantic import BaseModel, Field


class MacapatCheckRequest(BaseModel):
    nama_tembang: str = Field(..., min_length=1, description="Nama tembang macapat")
    lirik: list[str] = Field(..., min_length=1, description="Satu gatra per elemen")


class GatraAnalysis(BaseModel):
    gatra: int
    text: str
    target_wilangan: int | None = None
    actual_wilangan: int
    target_lagu: str | None = None
    actual_lagu: str
    valid: bool


class MacapatCheckResponse(BaseModel):
    status: str = "success"
    nama_tembang: str
    is_valid: bool
    analysis: list[GatraAnalysis]
    errors: list[str] = []
