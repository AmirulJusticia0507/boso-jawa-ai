"""Schemas untuk audit trail admin."""

from datetime import datetime

from pydantic import BaseModel, Field


class AuditLogItem(BaseModel):
    id: int
    admin_key_fingerprint: str
    action: str
    target_table: str
    target_id: int | None = None
    changes: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    request_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogPage(BaseModel):
    total: int = Field(..., ge=0)
    limit: int = Field(..., ge=1)
    offset: int = Field(..., ge=0)
    items: list[AuditLogItem]
