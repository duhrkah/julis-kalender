"""Category Pydantic schemas"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class CategoryBase(BaseModel):
    """Base category schema"""
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$', description="Hex color code (e.g., #FF5733)")
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    """Schema for creating a new category"""
    is_global: bool = False  # Global categories are visible to all tenants

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Konferenz",
                    "color": "#3B82F6",
                    "description": "Konferenzen und große Veranstaltungen",
                    "is_global": False
                }
            ]
        }
    )


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_global: Optional[bool] = None


class CategoryResponse(CategoryBase):
    """Schema for category response"""
    id: int
    is_active: bool
    is_global: bool
    tenant_id: Optional[int]
    created_at: datetime
    created_by: int

    model_config = ConfigDict(from_attributes=True)


class CategoryPublic(BaseModel):
    """Schema for public category view (active only)"""
    id: int
    name: str
    color: str
    description: Optional[str]
    is_global: bool = False
    tenant_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
