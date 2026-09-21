"""Skema endpoint dataset AI (stub — implementasi menyusul)."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DatasetItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    completion: str
    kategori: str
    is_verified: bool = False


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    model: str | None = Field(
        default=None, description="Opsional; default dari AI_MODEL di .env"
    )
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, ge=1, le=8192)


class ChatData(BaseModel):
    model: str
    answer: str


class ChatResponse(BaseModel):
    status: str = "success"
    data: ChatData


class ModelsResponse(BaseModel):
    status: str = "success"
    data: list[str]
