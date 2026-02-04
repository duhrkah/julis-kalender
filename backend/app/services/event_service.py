"""Event business logic service"""
from typing import List, Optional
from datetime import datetime, date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from fastapi import HTTPException, status

from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate
from app.services import email_service


def get_events(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    submitter_id: Optional[int] = None,
    search: Optional[str] = None,
    tenant_ids: Optional[List[int]] = None
) -> List[Event]:
    """
    Get events with filters

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        status_filter: Filter by status (pending, approved, rejected)
        category_id: Filter by category ID
        start_date: Filter events starting from this date
        end_date: Filter events up to this date
        submitter_id: Filter by submitter user ID
        search: Search in title and description (case-insensitive)
        tenant_ids: Filter by tenant IDs (multi-tenancy support)

    Returns:
        List[Event]: List of events
    """
    query = db.query(Event).options(joinedload(Event.category))

    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (Event.title.ilike(search_term)) | (Event.description.ilike(search_term))
        )

    if status_filter:
        query = query.filter(Event.status == status_filter)

    if category_id:
        query = query.filter(Event.category_id == category_id)

    if start_date:
        query = query.filter(Event.start_date >= start_date)

    if end_date:
        query = query.filter(Event.start_date <= end_date)

    if submitter_id:
        query = query.filter(Event.submitter_id == submitter_id)

    # Multi-tenancy filter
    if tenant_ids is not None and len(tenant_ids) > 0:
        # Include events from specified tenants OR events without tenant (legacy/global)
        query = query.filter(
            or_(
                Event.tenant_id.in_(tenant_ids),
                Event.tenant_id == None  # Include legacy events without tenant
            )
        )

    return query.order_by(Event.start_date.desc()).offset(skip).limit(limit).all()


def get_user_event_stats(db: Session, submitter_id: int) -> dict:
    """
    Get event counts for a user's submitted events by status.

    Args:
        db: Database session
        submitter_id: User ID (submitter)

    Returns:
        dict with total, pending, approved, rejected
    """
    total = db.query(Event).filter(Event.submitter_id == submitter_id).count()
    pending = db.query(Event).filter(
        Event.submitter_id == submitter_id, Event.status == "pending"
    ).count()
    approved = db.query(Event).filter(
        Event.submitter_id == submitter_id, Event.status == "approved"
    ).count()
    rejected = db.query(Event).filter(
        Event.submitter_id == submitter_id, Event.status == "rejected"
    ).count()
    return {"total": total, "pending": pending, "approved": approved, "rejected": rejected}


def get_event(db: Session, event_id: int) -> Optional[Event]:
    """
    Get event by ID

    Args:
        db: Database session
        event_id: Event ID

    Returns:
        Optional[Event]: Event if found, None otherwise
    """
    return db.query(Event).options(joinedload(Event.category)).filter(Event.id == event_id).first()


def create_event(
    db: Session,
    event: EventCreate,
    submitter_id: int,
    submitter_user: User,
    tenant_id: Optional[int] = None
) -> Event:
    """
    Create a new event (status: pending)

    Args:
        db: Database session
        event: Event creation data
        submitter_id: ID of the user submitting the event
        submitter_user: User object of submitter
        tenant_id: Optional tenant ID (defaults to user's tenant)

    Returns:
        Event: Created event
    """
    submitter_name = event.submitter_name or submitter_user.full_name or submitter_user.username
    submitter_email = event.submitter_email or submitter_user.email
    
    # Use provided tenant_id or fall back to user's tenant
    event_tenant_id = tenant_id if tenant_id is not None else submitter_user.tenant_id

    db_event = Event(
        **event.model_dump(exclude={'submitter_name', 'submitter_email'}),
        submitter_id=submitter_id,
        submitter_name=submitter_name,
        submitter_email=submitter_email,
        tenant_id=event_tenant_id,
        status="pending"
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return db_event


def update_event(
    db: Session,
    event_id: int,
    event_update: EventUpdate,
    user: User
) -> Event:
    """
    Update an event

    Args:
        db: Database session
        event_id: Event ID
        event_update: Event update data
        user: User performing the update

    Returns:
        Event: Updated event

    Raises:
        HTTPException: If event not found or user not authorized
    """
    db_event = get_event(db, event_id)

    if not db_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check permissions: User can only edit their own pending events
    # Admins and editors can edit any event
    if user.role not in ("admin", "editor"):
        if db_event.submitter_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to edit this event"
            )

        if db_event.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only edit pending events"
            )

    update_data = event_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)

    db.commit()
    db.refresh(db_event)

    return db_event


def delete_event(db: Session, event_id: int, user: User) -> bool:
    """
    Delete an event

    Args:
        db: Database session
        event_id: Event ID
        user: User performing the deletion

    Returns:
        bool: True if deleted successfully

    Raises:
        HTTPException: If event not found or user not authorized
    """
    db_event = get_event(db, event_id)

    if not db_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if user.role not in ("admin", "editor") and db_event.submitter_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this event"
        )

    db.delete(db_event)
    db.commit()

    return True


def approve_event(db: Session, event_id: int, admin_id: int) -> Event:
    """
    Approve an event

    Args:
        db: Database session
        event_id: Event ID
        admin_id: ID of admin approving the event

    Returns:
        Event: Approved event

    Raises:
        HTTPException: If event not found or already approved
    """
    db_event = get_event(db, event_id)

    if not db_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if db_event.status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is already approved"
        )

    db_event.status = "approved"
    db_event.approved_at = datetime.utcnow()
    db_event.approved_by = admin_id
    db_event.rejection_reason = None

    db.commit()
    db.refresh(db_event)

    _ = db_event.submitter
    email_service.send_event_approved(db_event)

    return db_event


def reject_event(
    db: Session,
    event_id: int,
    rejection_reason: str,
    admin_id: int
) -> Event:
    """
    Reject an event

    Args:
        db: Database session
        event_id: Event ID
        rejection_reason: Reason for rejection
        admin_id: ID of admin rejecting the event

    Returns:
        Event: Rejected event

    Raises:
        HTTPException: If event not found
    """
    db_event = get_event(db, event_id)

    if not db_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    db_event.status = "rejected"
    db_event.rejection_reason = rejection_reason
    db_event.approved_at = None
    db_event.approved_by = admin_id

    db.commit()
    db.refresh(db_event)

    _ = db_event.submitter
    email_service.send_event_rejected(db_event, rejection_reason)

    return db_event
