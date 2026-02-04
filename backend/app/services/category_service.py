"""Category business logic service"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def get_categories(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    tenant_ids: Optional[List[int]] = None,
    include_global: bool = True
) -> List[Category]:
    """
    Get all categories

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        active_only: Filter for active categories only
        tenant_ids: Filter by tenant IDs (multi-tenancy support)
        include_global: Include global categories (visible to all tenants)

    Returns:
        List[Category]: List of categories
    """
    query = db.query(Category)

    if active_only:
        query = query.filter(Category.is_active == True)

    # Multi-tenancy filter
    if tenant_ids is not None and len(tenant_ids) > 0:
        conditions = [Category.tenant_id.in_(tenant_ids)]
        if include_global:
            # Include global categories and legacy categories without tenant
            conditions.append(Category.is_global == True)
            conditions.append(Category.tenant_id == None)
        query = query.filter(or_(*conditions))
    elif include_global:
        # If no tenant specified but include_global is True, show global categories
        query = query.filter(
            or_(
                Category.is_global == True,
                Category.tenant_id == None
            )
        )

    return query.order_by(Category.name).offset(skip).limit(limit).all()


def get_category(db: Session, category_id: int) -> Optional[Category]:
    """
    Get category by ID

    Args:
        db: Database session
        category_id: Category ID

    Returns:
        Optional[Category]: Category if found, None otherwise
    """
    return db.query(Category).filter(Category.id == category_id).first()


def get_category_by_name(
    db: Session, 
    name: str, 
    tenant_id: Optional[int] = None
) -> Optional[Category]:
    """
    Get category by name (case-insensitive)

    Args:
        db: Database session
        name: Category name
        tenant_id: Tenant ID to filter by (optional)

    Returns:
        Optional[Category]: Category if found, None otherwise
    """
    query = db.query(Category).filter(Category.name.ilike(name.strip()))
    
    if tenant_id is not None:
        # Check tenant-specific first, then global
        query = query.filter(
            or_(
                Category.tenant_id == tenant_id,
                Category.is_global == True,
                Category.tenant_id == None
            )
        )
    
    return query.first()


def create_category(
    db: Session,
    category: CategoryCreate,
    creator_id: int,
    tenant_id: Optional[int] = None
) -> Category:
    """
    Create a new category

    Args:
        db: Database session
        category: Category creation data
        creator_id: ID of the user creating the category
        tenant_id: Tenant ID for the category (optional, for tenant-specific categories)

    Returns:
        Category: Created category

    Raises:
        HTTPException: If category name already exists for the same tenant
    """
    # Check if category name already exists for this tenant
    query = db.query(Category).filter(Category.name == category.name)
    if tenant_id is not None:
        query = query.filter(Category.tenant_id == tenant_id)
    else:
        # For global categories, check against all global/null tenant categories
        query = query.filter(
            or_(Category.tenant_id == None, Category.is_global == True)
        )
    
    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with name '{category.name}' already exists"
        )

    db_category = Category(
        **category.model_dump(),
        created_by=creator_id,
        tenant_id=tenant_id
    )

    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    return db_category


def update_category(
    db: Session,
    category_id: int,
    category_update: CategoryUpdate
) -> Category:
    """
    Update a category

    Args:
        db: Database session
        category_id: Category ID
        category_update: Category update data

    Returns:
        Category: Updated category

    Raises:
        HTTPException: If category not found or name conflict
    """
    db_category = get_category(db, category_id)

    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    if category_update.name and category_update.name != db_category.name:
        existing = db.query(Category).filter(
            Category.name == category_update.name,
            Category.id != category_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with name '{category_update.name}' already exists"
            )

    update_data = category_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)

    db.commit()
    db.refresh(db_category)

    return db_category


def delete_category(db: Session, category_id: int) -> bool:
    """
    Delete a category

    Args:
        db: Database session
        category_id: Category ID

    Returns:
        bool: True if deleted successfully

    Raises:
        HTTPException: If category not found
    """
    db_category = get_category(db, category_id)

    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    db.delete(db_category)
    db.commit()

    return True
