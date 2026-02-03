"""Category management endpoints (Admin only)"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, require_admin_or_editor
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.services import category_service
from app.services import audit_service

router = APIRouter()


@router.get("", response_model=List[CategoryResponse])
async def get_all_categories(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_editor)
):
    """
    Get all categories (Admin/Editor)

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        active_only: Filter for active categories only
        db: Database session
        _: Current admin user (required)

    Returns:
        List[CategoryResponse]: List of categories
    """
    categories = category_service.get_categories(db, skip, limit, active_only)
    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_editor)
):
    """
    Get category by ID (Admin/Editor)

    Args:
        category_id: Category ID
        db: Database session
        _: Current admin user (required)

    Returns:
        CategoryResponse: Category details
    """
    category = category_service.get_category(db, category_id)
    if not category:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Category not found")

    return category


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_editor)
):
    """
    Create a new category (Admin/Editor)

    Args:
        category: Category creation data
        db: Database session
        current_user: Current admin or editor user

    Returns:
        CategoryResponse: Created category
    """
    result = category_service.create_category(db, category, current_user.id)
    audit_service.create_audit_log(
        db, current_user.id, "create", "category", result.id, details={"name": result.name}
    )
    return result


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_or_editor)
):
    """
    Update a category (Admin/Editor)

    Args:
        category_id: Category ID
        category_update: Category update data
        db: Database session
        current_admin: Current admin user (required)

    Returns:
        CategoryResponse: Updated category
    """
    result = category_service.update_category(db, category_id, category_update)
    audit_service.create_audit_log(
        db, current_admin.id, "update", "category", category_id, details={"name": result.name}
    )
    return result


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_or_editor)
):
    """
    Delete a category (Admin/Editor)

    Args:
        category_id: Category ID
        db: Database session
        current_admin: Current admin user (required)

    Returns:
        None
    """
    category_service.delete_category(db, category_id)
    audit_service.create_audit_log(db, current_admin.id, "delete", "category", category_id)
    return None
