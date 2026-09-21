"""Skema endpoint pencarian kawruh basa."""

from pydantic import BaseModel, ConfigDict


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
    data: list[KawruhItem]
