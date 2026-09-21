"""Skema endpoint dataset AI (stub — implementasi menyusul)."""

from pydantic import BaseModel, ConfigDict


class DatasetItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    completion: str
    kategori: str
    is_verified: bool = False
