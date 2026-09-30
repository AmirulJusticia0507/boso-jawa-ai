"""Skema endpoint paribasan, bebasan, lan saloka."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ParibasanItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teks: str
    tegese: str
    kategori: str
    padanan_indonesia: str | None = None
    status: str = "published"
    deleted_at: datetime | None = None
    created_at: datetime | None = None


class ParibasanListResponse(BaseModel):
    status: str = "success"
    total: int
    page: int
    limit: int
    has_next: bool
    data: list[ParibasanItem]
