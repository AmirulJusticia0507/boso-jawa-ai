"""Skema endpoint dataset AI (stub — implementasi menyusul)."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

MAX_MESSAGE_CHARS = 4_000
MAX_CONVERSATION_CHARS = 12_000


class DatasetItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    completion: str
    kategori: str
    is_verified: bool = False


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(..., min_length=1, max_length=MAX_MESSAGE_CHARS)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1, max_length=20)
    model: str | None = Field(
        default=None,
        max_length=200,
        description="Opsional; default dari AI_MODEL di .env",
    )
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, ge=1, le=4096)

    @model_validator(mode="after")
    def validate_conversation_size(self) -> "ChatRequest":
        total = sum(len(message.content) for message in self.messages)
        if total > MAX_CONVERSATION_CHARS:
            raise ValueError(
                f"Total percakapan maksimal {MAX_CONVERSATION_CHARS} karakter."
            )
        return self


class ChatData(BaseModel):
    model: str
    answer: str
    sources: list["KnowledgeSource"] = Field(default_factory=list)


class KnowledgeSource(BaseModel):
    category: str
    title: str
    content: str


class ChatResponse(BaseModel):
    status: str = "success"
    data: ChatData


class ModelsResponse(BaseModel):
    status: str = "success"
    data: list[str]
