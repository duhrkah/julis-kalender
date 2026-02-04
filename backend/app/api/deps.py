"""API dependencies for database and authentication"""
from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status, Header, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.tenant import Tenant, TenantLevel
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for getting database session

    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token

    Args:
        token: JWT token from Authorization header
        db: Database session

    Returns:
        User: Current user model instance

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    return user


def _is_admin_or_editor(user: User) -> bool:
    """Check if user has admin or editor role."""
    return user.role in ("admin", "editor")


async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to require admin role (for user management only).
    Only admins can manage users.

    Args:
        current_user: Current authenticated user

    Returns:
        User: Current user if admin

    Raises:
        HTTPException: If user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


async def require_admin_or_editor(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to require admin or editor role.
    Editors can do everything admins can except user management.

    Args:
        current_user: Current authenticated user

    Returns:
        User: Current user if admin or editor

    Raises:
        HTTPException: If user is not admin or editor
    """
    if not _is_admin_or_editor(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or editor access required"
        )

    return current_user


# ============== Tenant Context Dependencies ==============

async def get_current_tenant(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Optional[Tenant]:
    """
    Get the current user's tenant.
    
    Args:
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Optional[Tenant]: User's tenant or None if not assigned
    """
    if current_user.tenant_id is None:
        return None
    
    return db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()


async def require_tenant(
    tenant: Optional[Tenant] = Depends(get_current_tenant)
) -> Tenant:
    """
    Dependency to require the user to have a tenant assigned.
    
    Args:
        tenant: Current user's tenant
    
    Returns:
        Tenant: User's tenant
    
    Raises:
        HTTPException: If user has no tenant assigned
    """
    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not assigned to any tenant"
        )
    
    return tenant


def get_tenant_filter(
    db: Session,
    user: User,
    requested_tenant_id: Optional[int] = None
) -> List[int]:
    """
    Get list of tenant IDs that a user can view/manage.
    
    - Bundesverband admin: can view all tenants
    - Landesverband admin: can view own tenant and child Bezirksverbände
    - Regular user: can only view own tenant
    
    Args:
        db: Database session
        user: Current user
        requested_tenant_id: Specific tenant ID requested (optional)
    
    Returns:
        List[int]: List of visible tenant IDs
    """
    if user.tenant_id is None:
        # User without tenant can't see any tenant-specific data
        return []
    
    user_tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not user_tenant:
        return []
    
    # Bundesverband can see all
    if user_tenant.level == TenantLevel.BUNDESVERBAND.value:
        if requested_tenant_id is not None:
            return [requested_tenant_id]
        # Return all tenant IDs
        all_tenants = db.query(Tenant.id).all()
        return [t.id for t in all_tenants]
    
    # Get own tenant and all children
    visible_ids = [user_tenant.id]
    visible_ids.extend(_get_all_child_tenant_ids(db, user_tenant.id))
    
    # If specific tenant requested, validate access
    if requested_tenant_id is not None:
        if requested_tenant_id in visible_ids:
            return [requested_tenant_id]
        return []  # User doesn't have access to requested tenant
    
    return visible_ids


def _get_all_child_tenant_ids(db: Session, tenant_id: int) -> List[int]:
    """Recursively get all child tenant IDs."""
    child_ids = []
    children = db.query(Tenant).filter(Tenant.parent_id == tenant_id).all()
    
    for child in children:
        child_ids.append(child.id)
        child_ids.extend(_get_all_child_tenant_ids(db, child.id))
    
    return child_ids


async def get_tenant_context(
    tenant_slug: Optional[str] = Header(None, alias="X-Tenant-Slug"),
    tenant_id: Optional[int] = Query(None, description="Tenant ID filter"),
    db: Session = Depends(get_db)
) -> Optional[int]:
    """
    Get tenant context from request header or query parameter.
    Used for public endpoints to filter by tenant.
    
    Priority:
    1. X-Tenant-Slug header
    2. tenant_id query parameter
    
    Args:
        tenant_slug: Tenant slug from X-Tenant-Slug header
        tenant_id: Tenant ID from query parameter
        db: Database session
    
    Returns:
        Optional[int]: Tenant ID or None for all tenants
    """
    if tenant_slug:
        tenant = db.query(Tenant).filter(
            Tenant.slug == tenant_slug,
            Tenant.is_active == True
        ).first()
        if tenant:
            return tenant.id
    
    if tenant_id:
        return tenant_id
    
    return None


async def get_visible_tenant_ids_for_public(
    tenant_id: Optional[int] = Depends(get_tenant_context),
    db: Session = Depends(get_db)
) -> List[int]:
    """
    Get list of tenant IDs visible for public requests.
    
    If tenant_id is provided, return that tenant and all its children.
    If no tenant specified, return all active tenant IDs.
    
    Args:
        tenant_id: Optional tenant ID from context
        db: Database session
    
    Returns:
        List[int]: List of visible tenant IDs
    """
    if tenant_id is None:
        # Return all active tenant IDs
        tenants = db.query(Tenant.id).filter(Tenant.is_active == True).all()
        return [t.id for t in tenants]
    
    # Return requested tenant and all children
    visible_ids = [tenant_id]
    visible_ids.extend(_get_all_child_tenant_ids(db, tenant_id))
    
    return visible_ids
