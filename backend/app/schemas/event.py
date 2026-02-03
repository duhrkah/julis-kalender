"""Event Pydantic schemas"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, time, datetime
from app.schemas.category import CategoryPublic


class EventBase(BaseModel):
    """Base event schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: date
    start_time: Optional[time] = None
    end_date: Optional[date] = None
    end_time: Optional[time] = None
    location: Optional[str] = Field(None, max_length=500)
    location_url: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = None
    is_public: bool = True


class EventCreate(EventBase):
    """Schema for creating a new event"""
    submitter_name: Optional[str] = Field(None, max_length=255)
    submitter_email: Optional[str] = Field(None, max_length=255)

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "title": "JuLis Bundeskongress 2026",
                    "description": "Jährlicher Bundeskongress der Jungen Liberalen",
                    "start_date": "2026-05-15",
                    "start_time": "10:00",
                    "end_date": "2026-05-17",
                    "end_time": "17:00",
                    "location": "Berlin Congress Center",
                    "location_url": "https://maps.google.com/?q=Berlin+Congress+Center",
                    "category_id": 1,
                    "submitter_name": "Max Mustermann",
                    "submitter_email": "max@example.com",
                    "is_public": True
                }
            ]
        }
    )


class EventUpdate(BaseModel):
    """Schema for updating an event"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: Optional[date] = None
    start_time: Optional[time] = None
    end_date: Optional[date] = None
    end_time: Optional[time] = None
    location: Optional[str] = Field(None, max_length=500)
    location_url: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = None
    is_public: Optional[bool] = None


class EventResponse(EventBase):
    """Schema for event response"""
    id: int
    status: str
    submitter_id: int
    submitter_name: Optional[str]
    submitter_email: Optional[str]
    rejection_reason: Optional[str]
    approved_at: Optional[datetime]
    approved_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    # Include category info
    category: Optional[CategoryPublic] = None

    model_config = ConfigDict(from_attributes=True)


class EventPublic(BaseModel):
    """Schema for public event view (approved only)"""
    id: int
    title: str
    description: Optional[str]
    start_date: date
    start_time: Optional[time]
    end_date: Optional[date]
    end_time: Optional[time]
    location: Optional[str]
    location_url: Optional[str]
    category_id: Optional[int]
    category: Optional[CategoryPublic] = None

    model_config = ConfigDict(from_attributes=True)


class UserEventStatsResponse(BaseModel):
    """User dashboard: counts of own events by status"""

    total: int
    pending: int
    approved: int
    rejected: int


class EventApproval(BaseModel):
    """Schema for event approval"""
    pass


class BulkEventIds(BaseModel):
    """Schema for bulk approve"""
    event_ids: List[int] = Field(..., min_length=1)


class BulkEventReject(BaseModel):
    """Schema for bulk reject"""
    event_ids: List[int] = Field(..., min_length=1)
    rejection_reason: str = Field(..., min_length=1)


class EventRejection(BaseModel):
    """Schema for event rejection"""
    rejection_reason: str = Field(..., min_length=1)

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "rejection_reason": "Event-Details sind unvollständig. Bitte Beschreibung hinzufügen."
                }
            ]
        }
    )
