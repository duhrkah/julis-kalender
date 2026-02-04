"""Tenant management endpoints"""
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_db, require_admin, get_current_user
from app.models.user import User
from app.schemas.tenant import (
    TenantCreate, TenantUpdate, TenantResponse, TenantPublic,
    TenantHierarchy, TenantStats
)
from app.services import tenant_service

router = APIRouter()


# ============== Public Endpoints ==============

@router.get("/public", response_model=List[TenantPublic])
async def get_public_tenants(
    level: Optional[str] = Query(None, description="Filter by level: bundesverband, landesverband, bezirksverband"),
    parent_id: Optional[int] = Query(None, description="Filter by parent tenant ID"),
    db: Session = Depends(get_db)
):
    """
    Get all active tenants (Public endpoint).
    Used for tenant selection dropdowns and navigation.
    
    Args:
        level: Filter by tenant level
        parent_id: Filter by parent tenant ID
        db: Database session
    
    Returns:
        List[TenantPublic]: List of active tenants
    """
    tenants = tenant_service.get_tenants(
        db, 
        active_only=True, 
        level=level,
        parent_id=parent_id
    )
    return tenants


@router.get("/public/{slug}", response_model=TenantPublic)
async def get_tenant_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """
    Get tenant by slug (Public endpoint).
    
    Args:
        slug: Tenant slug (URL-friendly identifier)
        db: Database session
    
    Returns:
        TenantPublic: Tenant details
    """
    from fastapi import HTTPException
    
    tenant = tenant_service.get_tenant_by_slug(db, slug)
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return tenant


@router.get("/public/hierarchy", response_model=List[TenantHierarchy])
async def get_tenant_hierarchy_public(
    db: Session = Depends(get_db)
):
    """
    Get tenant hierarchy tree (Public endpoint).
    Returns tenants structured as a tree for navigation.
    
    Args:
        db: Database session
    
    Returns:
        List[TenantHierarchy]: Hierarchical list of tenants
    """
    def build_hierarchy(tenant: TenantPublic) -> TenantHierarchy:
        children = tenant_service.get_tenant_hierarchy(db, tenant.id)
        return TenantHierarchy(
            id=tenant.id,
            name=tenant.name,
            slug=tenant.slug,
            level=tenant.level,
            parent_id=tenant.parent_id,
            logo_url=tenant.logo_url,
            primary_color=tenant.primary_color,
            children=[build_hierarchy(child) for child in children if child.is_active]
        )
    
    root_tenants = tenant_service.get_tenant_hierarchy(db, None)
    return [build_hierarchy(t) for t in root_tenants if t.is_active]


# ============== Admin Endpoints ==============

@router.get("", response_model=List[TenantResponse])
async def get_all_tenants(
    skip: int = 0,
    limit: int = 100,
    level: Optional[str] = Query(None, description="Filter by level"),
    parent_id: Optional[int] = Query(None, description="Filter by parent tenant ID"),
    active_only: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Get all tenants (Admin only).
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        level: Filter by tenant level
        parent_id: Filter by parent tenant ID
        active_only: If True, return only active tenants
        db: Database session
    
    Returns:
        List[TenantResponse]: List of tenants
    """
    tenants = tenant_service.get_tenants(
        db,
        skip=skip,
        limit=limit,
        active_only=active_only,
        level=level,
        parent_id=parent_id
    )
    return tenants


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Get tenant by ID (Admin only).
    
    Args:
        tenant_id: Tenant ID
        db: Database session
    
    Returns:
        TenantResponse: Tenant details
    """
    from fastapi import HTTPException
    
    tenant = tenant_service.get_tenant(db, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return tenant


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Create a new tenant (Admin only).
    
    Args:
        tenant_data: Tenant creation data
        db: Database session
    
    Returns:
        TenantResponse: Created tenant
    """
    return tenant_service.create_tenant(db, tenant_data)


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    tenant_update: TenantUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Update a tenant (Admin only).
    
    Args:
        tenant_id: Tenant ID
        tenant_update: Tenant update data
        db: Database session
    
    Returns:
        TenantResponse: Updated tenant
    """
    return tenant_service.update_tenant(db, tenant_id, tenant_update)


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Delete a tenant (Admin only).
    Cannot delete tenants with children or associated users.
    
    Args:
        tenant_id: Tenant ID
        db: Database session
    """
    tenant_service.delete_tenant(db, tenant_id)
    return None


@router.get("/{tenant_id}/stats", response_model=TenantStats)
async def get_tenant_statistics(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics for a specific tenant.
    Users can only see stats for their own tenant.
    Admins can see any tenant.
    
    Args:
        tenant_id: Tenant ID
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        TenantStats: Tenant statistics
    """
    from fastapi import HTTPException
    
    # Non-admins can only see their own tenant stats
    if current_user.role != "admin" and current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this tenant's stats")
    
    return tenant_service.get_tenant_stats(db, tenant_id)


@router.get("/{tenant_id}/aggregated-stats", response_model=List[TenantStats])
async def get_aggregated_statistics(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Get aggregated statistics for a tenant and all its children (Admin only).
    Useful for Bundesverband to see stats from all Landesverbände.
    
    Args:
        tenant_id: Parent tenant ID
        db: Database session
    
    Returns:
        List[TenantStats]: List of stats for tenant and all children
    """
    return tenant_service.get_aggregated_stats(db, tenant_id)
