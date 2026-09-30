"""Skema endpoint validasi macapat."""

from pydantic import BaseModel, ConfigDict, Field


class MacapatCheckRequest(BaseModel):
    nama_tembang: str = Field(..., min_length=1, max_length=50, description="Nama tembang macapat (alias diterima)")
    lirik: list[str] = Field(..., min_length=1, max_length=30, description="Satu gatra per elemen")


class Wanda(BaseModel):
    """Daftar wanda hasil segmentasi satu gatra."""

    wanda: list[str] = Field(default_factory=list)


class GatraAnalysis(BaseModel):
    gatra: int
    text: str
    wanda: list[str] = Field(default_factory=list)
    target_wilangan: int | None = None
    actual_wilangan: int
    target_lagu: str | None = None
    actual_lagu: str
    valid: bool
    suggestion: str | None = None


class MacapatCheckResponse(BaseModel):
    status: str = "success"
    nama_tembang: str
    is_valid: bool
    score: float = Field(..., ge=0, le=100)
    valid_gatra: int = Field(..., ge=0)
    total_gatra: int = Field(..., ge=0)
    analysis: list[GatraAnalysis]
    errors: list[str] = Field(default_factory=list)


class PaugeranGatra(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    gatra: int
    wilangan: int
    lagu: str


class MacapatListItem(BaseModel):
    nama_tembang: str
    alias: list[str] = Field(default_factory=list)
    gatra: int
    paugeran: list[PaugeranGatra]
    watak: str | None = None


class MacapatListResponse(BaseModel):
    status: str = "success"
    data: list[MacapatListItem]
    total: int
