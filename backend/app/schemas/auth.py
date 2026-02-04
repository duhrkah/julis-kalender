"""Authentication Pydantic schemas"""
from pydantic import BaseModel, EmailStr


class TokenData(BaseModel):
    """Token data extracted from JWT"""
    username: str | None = None
    user_id: int | None = None
    role: str | None = None


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: int | None = None
    exp: int | None = None


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    """Login request body"""
    username: str
    password: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "username": "admin",
                    "password": "admin123"
                }
            ]
        }
    }


class LoginResponse(BaseModel):
    """Login response with token and user info"""
    access_token: str
    token_type: str = "bearer"
    user: dict

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                    "token_type": "bearer",
                    "user": {
                        "id": 1,
                        "username": "admin",
                        "email": "admin@example.com",
                        "role": "admin"
                    }
                }
            ]
        }
    }
