"""Public endpoints (no authentication required)"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.api.deps import get_db
from app.schemas.category import CategoryPublic
from app.schemas.event import EventPublic
from app.services import category_service, event_service, ical_service

router = APIRouter()


@router.get("/categories", response_model=List[CategoryPublic])
async def get_public_categories(
    db: Session = Depends(get_db)
):
    """
    Get all active categories (Public endpoint)

    Args:
        db: Database session

    Returns:
        List[CategoryPublic]: List of active categories
    """
    categories = category_service.get_categories(db, active_only=True)
    return categories


@router.get("/events", response_model=List[EventPublic])
async def get_public_events(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    category: Optional[str] = Query(None, description="Filter by category name (alternative to category_id)"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    start_date: Optional[date] = Query(None, description="Filter events starting from this date"),
    end_date: Optional[date] = Query(None, description="Filter events up to this date"),
    db: Session = Depends(get_db)
):
    """
    Get all approved events (Public endpoint)

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        category_id: Filter by category ID
        category: Filter by category name (e.g. ?category=Landesverband)
        start_date: Filter events starting from this date
        end_date: Filter events up to this date
        db: Database session

    Returns:
        List[EventPublic]: List of approved events
    """
    resolved_category_id = category_id
    if category and not category_id:
        cat = category_service.get_category_by_name(db, category)
        if cat:
            resolved_category_id = cat.id

    events = event_service.get_events(
        db,
        skip=skip,
        limit=limit,
        status_filter="approved",
        category_id=resolved_category_id,
        start_date=start_date,
        end_date=end_date,
        search=search
    )
    return events


@router.get("/events/{event_id}", response_model=EventPublic)
async def get_public_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    """
    Get single approved event (Public endpoint)

    Args:
        event_id: Event ID
        db: Database session

    Returns:
        EventPublic: Event details
    """
    event = event_service.get_event(db, event_id)

    if not event:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status != "approved":
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Event not found")

    return event


@router.get("/ical", response_class=Response)
async def export_ical(
    category_id: Optional[int] = None,
    start_date: Optional[date] = Query(None, description="Filter events starting from this date"),
    end_date: Optional[date] = Query(None, description="Filter events up to this date"),
    db: Session = Depends(get_db)
):
    """
    Export approved events as iCal/ICS file (Public endpoint)

    Args:
        category_id: Filter by category ID
        start_date: Filter events starting from this date
        end_date: Filter events up to this date
        db: Database session

    Returns:
        Response: iCal file (.ics)
    """
    events = event_service.get_events(
        db,
        skip=0,
        limit=1000,
        status_filter="approved",
        category_id=category_id,
        start_date=start_date,
        end_date=end_date
    )

    ical_content = ical_service.generate_ical(events)

    return Response(
        content=ical_content,
        media_type="text/calendar; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=calendar.ics"
        }
    )
