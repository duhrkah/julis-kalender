"""Category business logic service"""
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def get_categories(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False
) -> List[Category]:
    """
    Get all categories

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        active_only: Filter for active categories only

    Returns:
        List[Category]: List of categories
    """
    query = db.query(Category)

    if active_only:
        query = query.filter(Category.is_active == True)

    return query.offset(skip).limit(limit).all()


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


def create_category(
    db: Session,
    category: CategoryCreate,
    creator_id: int
) -> Category:
    """
    Create a new category

    Args:
        db: Database session
        category: Category creation data
        creator_id: ID of the user creating the category

    Returns:
        Category: Created category

    Raises:
        HTTPException: If category name already exists
    """
    # Check if category name already exists
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with name '{category.name}' already exists"
        )

    db_category = Category(
        **category.model_dump(),
        created_by=creator_id
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
