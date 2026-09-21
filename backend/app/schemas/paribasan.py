"""Skema endpoint paribasan, bebasan, lan saloka."""

from pydantic import BaseModel, ConfigDict


class ParibasanItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teks: str
    tegese: str
    kategori: str
    padanan_indonesia: str | None = None


class ParibasanListResponse(BaseModel):
    status: str = "success"
    total: int
    data: list[ParibasanItem]