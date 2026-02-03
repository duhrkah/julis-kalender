"""User Pydantic schemas"""
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema"""
    username: str
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str
    role: str = "user"  # admin, editor, or user

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "username": "johndoe",
                    "email": "john@example.com",
                    "full_name": "John Doe",
                    "password": "strongpassword123",
                    "role": "user"
                }
            ]
        }
    )


class UserUpdate(BaseModel):
    """Schema for updating a user (admin can edit username, role, etc.)"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfile(BaseModel):
    """Schema for user profile (without sensitive data)"""
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str]
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
