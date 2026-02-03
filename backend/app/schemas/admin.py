"""Admin Pydantic schemas"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AdminStatsResponse(BaseModel):
    """Admin dashboard statistics"""

    pending_events: int
    approved_events: int
    rejected_events: int
    categories_count: int
    users_count: int


class AuditLogResponse(BaseModel):
    """Audit log entry for API response"""

    id: int
    user_id: int
    username: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
