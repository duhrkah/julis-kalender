"""Tenant business logic service"""
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.tenant import Tenant, TenantLevel
from app.models.event import Event
from app.models.user import User
from app.models.category import Category
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantStats


def get_tenants(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    level: Optional[str] = None,
    parent_id: Optional[int] = None
) -> List[Tenant]:
    """
    Get tenants with filters.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        active_only: If True, return only active tenants
        level: Filter by tenant level (bundesverband, landesverband, bezirksverband)
        parent_id: Filter by parent tenant ID
    
    Returns:
        List[Tenant]: List of tenants
    """
    query = db.query(Tenant)
    
    if active_only:
        query = query.filter(Tenant.is_active == True)
    
    if level:
        query = query.filter(Tenant.level == level)
    
    if parent_id is not None:
        query = query.filter(Tenant.parent_id == parent_id)
    
    return query.order_by(Tenant.name).offset(skip).limit(limit).all()


def get_tenant(db: Session, tenant_id: int) -> Optional[Tenant]:
    """
    Get tenant by ID.
    
    Args:
        db: Database session
        tenant_id: Tenant ID
    
    Returns:
        Optional[Tenant]: Tenant if found, None otherwise
    """
    return db.query(Tenant).filter(Tenant.id == tenant_id).first()


def get_tenant_by_slug(db: Session, slug: str) -> Optional[Tenant]:
    """
    Get tenant by slug.
    
    Args:
        db: Database session
        slug: Tenant slug (URL-friendly identifier)
    
    Returns:
        Optional[Tenant]: Tenant if found, None otherwise
    """
    return db.query(Tenant).filter(Tenant.slug == slug).first()


def get_bundesverband(db: Session) -> Optional[Tenant]:
    """
    Get the Bundesverband (top-level tenant).
    
    Args:
        db: Database session
    
    Returns:
        Optional[Tenant]: Bundesverband tenant if exists
    """
    return db.query(Tenant).filter(
        Tenant.level == TenantLevel.BUNDESVERBAND.value
    ).first()


def get_tenant_hierarchy(db: Session, tenant_id: Optional[int] = None) -> List[Tenant]:
    """
    Get tenants in hierarchical structure.
    If tenant_id is provided, get children of that tenant.
    Otherwise, get all root tenants (Bundesverband level).
    
    Args:
        db: Database session
        tenant_id: Parent tenant ID (optional)
    
    Returns:
        List[Tenant]: List of tenants with children populated
    """
    if tenant_id is None:
        # Get root tenants (no parent)
        return db.query(Tenant).filter(Tenant.parent_id == None).all()
    else:
        return db.query(Tenant).filter(Tenant.parent_id == tenant_id).all()


def get_all_child_tenant_ids(db: Session, tenant_id: int) -> List[int]:
    """
    Recursively get all child tenant IDs for a given tenant.
    Used for aggregated queries at Bundesverband level.
    
    Args:
        db: Database session
        tenant_id: Parent tenant ID
    
    Returns:
        List[int]: List of all child tenant IDs
    """
    child_ids = []
    children = db.query(Tenant).filter(Tenant.parent_id == tenant_id).all()
    
    for child in children:
        child_ids.append(child.id)
        child_ids.extend(get_all_child_tenant_ids(db, child.id))
    
    return child_ids


def get_visible_tenant_ids(db: Session, tenant: Tenant) -> List[int]:
    """
    Get all tenant IDs that are visible to the given tenant.
    
    - Bundesverband sees all tenants
    - Landesverband sees itself and its Bezirksverbände
    - Bezirksverband sees only itself
    
    Args:
        db: Database session
        tenant: Current tenant
    
    Returns:
        List[int]: List of visible tenant IDs
    """
    if tenant.level == TenantLevel.BUNDESVERBAND.value:
        # Bundesverband sees all
        all_tenants = db.query(Tenant.id).all()
        return [t.id for t in all_tenants]
    
    # Include self and all children
    visible_ids = [tenant.id]
    visible_ids.extend(get_all_child_tenant_ids(db, tenant.id))
    
    return visible_ids


def create_tenant(db: Session, tenant_data: TenantCreate) -> Tenant:
    """
    Create a new tenant.
    
    Args:
        db: Database session
        tenant_data: Tenant creation data
    
    Returns:
        Tenant: Created tenant
    
    Raises:
        HTTPException: If slug already exists or parent not found
    """
    # Check if slug is unique
    existing = get_tenant_by_slug(db, tenant_data.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tenant with slug '{tenant_data.slug}' already exists"
        )
    
    # Validate parent if provided
    if tenant_data.parent_id:
        parent = get_tenant(db, tenant_data.parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent tenant not found"
            )
    
    db_tenant = Tenant(**tenant_data.model_dump())
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    
    return db_tenant


def update_tenant(
    db: Session,
    tenant_id: int,
    tenant_update: TenantUpdate
) -> Tenant:
    """
    Update a tenant.
    
    Args:
        db: Database session
        tenant_id: Tenant ID
        tenant_update: Tenant update data
    
    Returns:
        Tenant: Updated tenant
    
    Raises:
        HTTPException: If tenant not found or slug conflict
    """
    db_tenant = get_tenant(db, tenant_id)
    
    if not db_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    update_data = tenant_update.model_dump(exclude_unset=True)
    
    # Check slug uniqueness if being changed
    if 'slug' in update_data and update_data['slug'] != db_tenant.slug:
        existing = get_tenant_by_slug(db, update_data['slug'])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tenant with slug '{update_data['slug']}' already exists"
            )
    
    # Validate parent if being changed
    if 'parent_id' in update_data and update_data['parent_id']:
        # Prevent circular references
        if update_data['parent_id'] == tenant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant cannot be its own parent"
            )
        
        parent = get_tenant(db, update_data['parent_id'])
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent tenant not found"
            )
    
    for field, value in update_data.items():
        setattr(db_tenant, field, value)
    
    db.commit()
    db.refresh(db_tenant)
    
    return db_tenant


def delete_tenant(db: Session, tenant_id: int) -> bool:
    """
    Delete a tenant.
    
    Args:
        db: Database session
        tenant_id: Tenant ID
    
    Returns:
        bool: True if deleted successfully
    
    Raises:
        HTTPException: If tenant not found or has children
    """
    db_tenant = get_tenant(db, tenant_id)
    
    if not db_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check if tenant has children
    children = db.query(Tenant).filter(Tenant.parent_id == tenant_id).count()
    if children > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete tenant with child tenants. Delete children first."
        )
    
    # Check if tenant has users
    users = db.query(User).filter(User.tenant_id == tenant_id).count()
    if users > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete tenant with {users} associated users"
        )
    
    db.delete(db_tenant)
    db.commit()
    
    return True


def get_tenant_stats(db: Session, tenant_id: int) -> TenantStats:
    """
    Get statistics for a tenant.
    
    Args:
        db: Database session
        tenant_id: Tenant ID
    
    Returns:
        TenantStats: Tenant statistics
    
    Raises:
        HTTPException: If tenant not found
    """
    tenant = get_tenant(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Get event counts
    total_events = db.query(Event).filter(Event.tenant_id == tenant_id).count()
    pending_events = db.query(Event).filter(
        Event.tenant_id == tenant_id,
        Event.status == "pending"
    ).count()
    approved_events = db.query(Event).filter(
        Event.tenant_id == tenant_id,
        Event.status == "approved"
    ).count()
    rejected_events = db.query(Event).filter(
        Event.tenant_id == tenant_id,
        Event.status == "rejected"
    ).count()
    
    # Get user count
    total_users = db.query(User).filter(User.tenant_id == tenant_id).count()
    
    # Get category count
    total_categories = db.query(Category).filter(Category.tenant_id == tenant_id).count()
    
    return TenantStats(
        tenant_id=tenant_id,
        tenant_name=tenant.name,
        total_events=total_events,
        pending_events=pending_events,
        approved_events=approved_events,
        rejected_events=rejected_events,
        total_users=total_users,
        total_categories=total_categories
    )


def get_aggregated_stats(db: Session, tenant_id: int) -> List[TenantStats]:
    """
    Get aggregated statistics for a tenant and all its children.
    Useful for Bundesverband to see stats from all Landesverbände.
    
    Args:
        db: Database session
        tenant_id: Parent tenant ID
    
    Returns:
        List[TenantStats]: List of stats for each child tenant
    """
    tenant = get_tenant(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    stats_list = []
    
    # Get stats for the tenant itself
    stats_list.append(get_tenant_stats(db, tenant_id))
    
    # Get stats for all children
    child_ids = get_all_child_tenant_ids(db, tenant_id)
    for child_id in child_ids:
        try:
            stats_list.append(get_tenant_stats(db, child_id))
        except HTTPException:
            continue
    
    return stats_list
