"""Tenant Pydantic schemas for multi-tenancy"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TenantLevel(str, Enum):
    """Tenant hierarchy levels"""
    BUNDESVERBAND = "bundesverband"
    LANDESVERBAND = "landesverband"
    BEZIRKSVERBAND = "bezirksverband"


class TenantBase(BaseModel):
    """Base tenant schema"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r'^[a-z0-9-]+$')
    description: Optional[str] = None
    level: TenantLevel = TenantLevel.LANDESVERBAND
    logo_url: Optional[str] = Field(None, max_length=500)
    primary_color: Optional[str] = Field(None, max_length=7, pattern=r'^#[0-9A-Fa-f]{6}$')


class TenantCreate(TenantBase):
    """Schema for creating a new tenant"""
    parent_id: Optional[int] = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "JuLis Bayern",
                    "slug": "bayern",
                    "description": "Junge Liberale Bayern",
                    "level": "landesverband",
                    "parent_id": 1,
                    "primary_color": "#FFCC00"
                }
            ]
        }
    )


class TenantUpdate(BaseModel):
    """Schema for updating a tenant"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100, pattern=r'^[a-z0-9-]+$')
    description: Optional[str] = None
    level: Optional[TenantLevel] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None
    logo_url: Optional[str] = Field(None, max_length=500)
    primary_color: Optional[str] = Field(None, max_length=7, pattern=r'^#[0-9A-Fa-f]{6}$')


class TenantResponse(TenantBase):
    """Schema for tenant response"""
    id: int
    parent_id: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantPublic(BaseModel):
    """Schema for public tenant view"""
    id: int
    name: str
    slug: str
    level: str
    parent_id: Optional[int]
    logo_url: Optional[str]
    primary_color: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class TenantHierarchy(TenantPublic):
    """Schema for tenant with children (tree structure)"""
    children: List['TenantHierarchy'] = []

    model_config = ConfigDict(from_attributes=True)


# Enable self-referencing
TenantHierarchy.model_rebuild()


class TenantStats(BaseModel):
    """Statistics for a tenant"""
    tenant_id: int
    tenant_name: str
    total_events: int
    pending_events: int
    approved_events: int
    rejected_events: int
    total_users: int
    total_categories: int
