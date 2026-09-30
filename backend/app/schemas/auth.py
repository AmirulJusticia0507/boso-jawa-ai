"""Skema autentikasi admin."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


AdminRole = Literal["admin", "editor", "reviewer"]


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    role: AdminRole
    exp: int
    type: str


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AdminUserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8)
    role: AdminRole = "editor"


class AdminUserUpdate(BaseModel):
    password: Optional[str] = Field(default=None, min_length=8)
    role: Optional[AdminRole] = None
    is_active: Optional[bool] = None


class AdminUserItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: AdminRole
    is_active: bool
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class AdminUserListResponse(BaseModel):
    status: str = "success"
    total: int
    page: int
    limit: int
    has_next: bool
    data: list[AdminUserItem]


class AdminSessionResponse(BaseModel):
    status: str = "success"
    data: dict