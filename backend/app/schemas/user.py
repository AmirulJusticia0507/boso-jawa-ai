from pydantic import BaseModel, ConfigDict, Field


class UserCredentials(BaseModel):
    username: str = Field(min_length=3, max_length=64, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str = Field(min_length=8, max_length=128)
    captcha_token: str = Field(min_length=1)
    captcha_answer: int = Field(ge=0, le=100)


class UserHistoryItem(BaseModel):
    client_id: str = Field(max_length=64)
    type: str = Field(max_length=30)
    input: str = Field(max_length=10_000)
    output: str = Field(max_length=20_000)
    timestamp: int


class HistorySyncRequest(BaseModel):
    items: list[UserHistoryItem] = Field(max_length=100)


class BookmarkCreate(BaseModel):
    resource_type: str = Field(max_length=30)
    resource_id: str = Field(max_length=100)
    title: str = Field(max_length=255)
    collection: str = Field(default="Favorit", max_length=100)
    note: str | None = Field(default=None, max_length=2000)


class BookmarkItem(BookmarkCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class FeedbackCreate(BaseModel):
    resource_type: str = Field(max_length=30)
    resource_id: str | None = Field(default=None, max_length=100)
    message: str = Field(min_length=5, max_length=5000)
    suggestion: str | None = Field(default=None, max_length=5000)
