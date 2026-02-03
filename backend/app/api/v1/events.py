"""User event endpoints"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate, EventResponse, UserEventStatsResponse
from app.services import event_service

router = APIRouter()


@router.get("/stats", response_model=UserEventStatsResponse)
async def get_my_event_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get current user's event counts by status (for dashboard).
    """
    stats = event_service.get_user_event_stats(db, current_user.id)
    return UserEventStatsResponse(**stats)


@router.get("", response_model=List[EventResponse])
async def get_my_events(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's submitted events

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        current_user: Current authenticated user

    Returns:
        List[EventResponse]: List of user's events
    """
    events = event_service.get_events(
        db,
        skip=skip,
        limit=limit,
        submitter_id=current_user.id
    )
    return events


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get event by ID (own events only for non-admins)

    Args:
        event_id: Event ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        EventResponse: Event details
    """
    event = event_service.get_event(db, event_id)

    if not event:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Event not found")

    # Non-admins/editors can only view their own events
    if current_user.role not in ("admin", "editor") and event.submitter_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized to view this event")

    return event


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new event (status: pending)

    Args:
        event: Event creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        EventResponse: Created event
    """
    return event_service.create_event(db, event, current_user.id, current_user)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_update: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an event (only pending events for non-admins)

    Args:
        event_id: Event ID
        event_update: Event update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        EventResponse: Updated event
    """
    return event_service.update_event(db, event_id, event_update, current_user)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an event

    Args:
        event_id: Event ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        None
    """
    event_service.delete_event(db, event_id, current_user)
    return None
