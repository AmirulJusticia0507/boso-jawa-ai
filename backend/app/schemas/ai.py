"""Skema endpoint dataset AI."""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.services.dataset import (
    MAX_COMPLETION_CHARS,
    MAX_KATEGORI_CHARS,
    MAX_PROMPT_CHARS,
    MAX_ROWS_PER_IMPORT,
    RowError,
)

MAX_MESSAGE_CHARS = 4_000
MAX_CONVERSATION_CHARS = 12_000


class DatasetItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    completion: str
    kategori: str
    is_verified: bool = False


class DatasetExportQuery(BaseModel):
    kategori: str | None = Field(default=None, max_length=MAX_KATEGORI_CHARS)
    is_verified: bool | None = None
    limit: int = Field(default=1_000, ge=1, le=10_000)
    offset: int = Field(default=0, ge=0)


class DatasetImportRequest(BaseModel):
    """Body import. Isi `items` untuk JSON, atau `raw` + `content_type`."""

    items: list[dict[str, Any]] | None = Field(default=None, max_length=MAX_ROWS_PER_IMPORT)
    raw: str | None = Field(default=None, max_length=20_000_000)
    content_type: Literal["application/json", "application/x-ndjson", "text/csv"] | None = None
    mode: Literal["insert", "upsert"] = "insert"
    mark_verified: bool = False

    @model_validator(mode="after")
    def validate_source(self) -> "DatasetImportRequest":
        if self.items is None and self.raw is None:
            raise ValueError("Isi `items` atau `raw`.")
        if self.items is not None and not self.items:
            raise ValueError("`items` tidak boleh kosong.")
        return self


class DatasetImportResult(BaseModel):
    status: str = "success"
    data: "DatasetImportData"


class DatasetImportData(BaseModel):
    received: int
    created: int
    updated: int
    skipped_duplicate_in_payload: int
    skipped_existing: int
    errors: list[RowError] = Field(default_factory=list)

    @property
    def failed(self) -> int:
        return len(self.errors)


class DatasetExportResponse(BaseModel):
    status: str = "success"
    data: "DatasetExportData"


class DatasetExportData(BaseModel):
    format: str
    count: int
    verified: int
    per_kategori: dict[str, int] = Field(default_factory=dict)
    content: str


class DatasetVerifyRequest(BaseModel):
    is_verified: bool = True
    note: str | None = Field(default=None, max_length=500)


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


DatasetImportResult.model_rebuild()
DatasetExportResponse.model_rebuild()

__all__ = [
    "MAX_COMPLETION_CHARS",
    "MAX_KATEGORI_CHARS",
    "MAX_MESSAGE_CHARS",
    "MAX_PROMPT_CHARS",
    "ChatData",
    "ChatRequest",
    "ChatResponse",
    "ChatMessage",
    "DatasetExportData",
    "DatasetExportQuery",
    "DatasetExportResponse",
    "DatasetImportData",
    "DatasetImportRequest",
    "DatasetImportResult",
    "DatasetItem",
    "DatasetVerifyRequest",
    "KnowledgeSource",
    "ModelsResponse",
    "RowError",
]
