"""User management endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_user, require_admin
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserProfile
from app.core.security import get_password_hash
from app.services import audit_service

router = APIRouter()


# User profile endpoints (authenticated users)

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's profile

    Args:
        current_user: Current authenticated user

    Returns:
        UserProfile: User profile
    """
    return current_user


@router.put("/me", response_model=UserProfile)
async def update_current_user_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update current user's profile

    Args:
        user_update: User update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        UserProfile: Updated user profile
    """
    update_data = user_update.model_dump(exclude_unset=True, exclude={'role', 'is_active', 'username'})

    for field, value in update_data.items():
        if field == 'password' and value:
            setattr(current_user, 'password_hash', get_password_hash(value))
        elif value is not None:
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


# Admin user management endpoints

@router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Get all users (Admin only)

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        _: Current admin user (required)

    Returns:
        List[UserResponse]: List of users
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/admin/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Get user by ID (Admin only)

    Args:
        user_id: User ID
        db: Database session
        _: Current admin user (required)

    Returns:
        UserResponse: User details
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.post("/admin/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """
    Create a new user (Admin only)

    Args:
        user: User creation data
        db: Database session
        current_admin: Current admin user (required)

    Returns:
        UserResponse: Created user
    """
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        password_hash=get_password_hash(user.password),
        role=user.role,
        is_active=True
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    audit_service.create_audit_log(
        db, current_admin.id, "create", "user", db_user.id, details={"username": db_user.username}
    )
    return db_user


@router.put("/admin/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """
    Update a user (Admin only)

    Args:
        user_id: User ID
        user_update: User update data
        db: Database session
        current_admin: Current admin user (required)

    Returns:
        UserResponse: Updated user
    """
    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)

    # Check username uniqueness if changing
    if "username" in update_data and update_data["username"] != db_user.username:
        existing = db.query(User).filter(User.username == update_data["username"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")

    for field, value in update_data.items():
        if field == 'password' and value:
            setattr(db_user, 'password_hash', get_password_hash(value))
        elif value is not None:
            setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)

    audit_service.create_audit_log(
        db, current_admin.id, "update", "user", user_id, details={"username": db_user.username}
    )
    return db_user


@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """
    Delete a user (Admin only)

    Args:
        user_id: User ID
        db: Database session
        current_admin: Current admin user

    Returns:
        None
    """
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    username = db_user.username
    db.delete(db_user)
    db.commit()

    audit_service.create_audit_log(
        db, current_admin.id, "delete", "user", user_id, details={"username": username}
    )
    return None
