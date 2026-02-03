"""Admin event management endpoints"""
from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import csv
import io

from app.api.deps import get_db, require_admin, require_admin_or_editor
from app.models.user import User
from app.models.event import Event
from app.models.category import Category
from app.schemas.event import EventResponse, EventUpdate, EventRejection, BulkEventIds, BulkEventReject
from app.schemas.admin import AdminStatsResponse, AuditLogResponse
from app.services import event_service
from app.services import audit_service

router = APIRouter()


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_editor),
):
    """
    Get admin dashboard statistics (Admin/Editor).
    Users count only visible to admins.
    """
    pending_events = db.query(Event).filter(Event.status == "pending").count()
    approved_events = db.query(Event).filter(Event.status == "approved").count()
    rejected_events = db.query(Event).filter(Event.status == "rejected").count()
    categories_count = db.query(Category).count()
    users_count = db.query(User).count() if current_user.role == "admin" else None

    return AdminStatsResponse(
        pending_events=pending_events,
        approved_events=approved_events,
        rejected_events=rejected_events,
        categories_count=categories_count,
        users_count=users_count,
    )


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = Query(None, description="Filter by admin user ID"),
    action: Optional[str] = Query(None, description="Filter by action"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_editor),
):
    """
    Get audit logs (Admin/Editor).
    """
    logs = audit_service.get_audit_logs(
        db, skip=skip, limit=limit, user_id=user_id, action=action, entity_type=entity_type
    )
    return [
        AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            username=log.user.username if log.user else None,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            details=log.details,
            created_at=log.created_at,
        )
        for log in logs
    ]


@router.get("/events", response_model=List[EventResponse])
async def get_all_events(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected"),
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_editor)
):
    """
    Get all events with filters (Admin/Editor)

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        status_filter: Filter by status
        category_id: Filter by category ID
        start_date: Filter events starting from this date
        end_date: Filter events up to this date
        db: Database session
        _: Current admin user (required)

    Returns:
        List[EventResponse]: List of events
    """
    events = event_service.get_events(
        db,
        skip=skip,
        limit=limit,
        status_filter=status_filter,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date
    )
    return events


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_editor)
):
    """
    Get event by ID (Admin/Editor)

    Args:
        event_id: Event ID
        db: Database session
        _: Current admin user (required)

    Returns:
        EventResponse: Event details
    """
    event = event_service.get_event(db, event_id)

    if not event:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Event not found")

    return event


@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_update: EventUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_or_editor)
):
    """
    Update any event (Admin/Editor)

    Args:
        event_id: Event ID
        event_update: Event update data
        db: Database session
        current_admin: Current admin user

    Returns:
        EventResponse: Updated event
    """
    result = event_service.update_event(db, event_id, event_update, current_admin)
    audit_service.create_audit_log(
        db, current_admin.id, "update", "event", event_id, details={"title": result.title}
    )
    return result


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_or_editor)
):
    """
    Delete any event (Admin/Editor)

    Args:
        event_id: Event ID
        db: Database session
        current_admin: Current admin user

    Returns:
        None
    """
    event_service.delete_event(db, event_id, current_admin)
    audit_service.create_audit_log(db, current_admin.id, "delete", "event", event_id)
    return None


@router.put("/events/{event_id}/approve", response_model=EventResponse)
async def approve_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_or_editor)
):
    """
    Approve an event (Admin/Editor)

    Args:
        event_id: Event ID
        db: Database session
        current_admin: Current admin user

    Returns:
        EventResponse: Approved event
    """
    result = event_service.approve_event(db, event_id, current_admin.id)
    audit_service.create_audit_log(db, current_admin.id, "approve", "event", event_id)
    return result


@router.put("/events/{event_id}/reject", response_model=EventResponse)
async def reject_event(
    event_id: int,
    rejection: EventRejection,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_or_editor)
):
    """
    Reject an event (Admin/Editor)

    Args:
        event_id: Event ID
        rejection: Rejection data with reason
        db: Database session
        current_admin: Current admin user

    Returns:
        EventResponse: Rejected event
    """
    result = event_service.reject_event(
        db,
        event_id,
        rejection.rejection_reason,
        current_admin.id
    )
    audit_service.create_audit_log(
        db, current_admin.id, "reject", "event", event_id,
        details={"rejection_reason": rejection.rejection_reason}
    )
    return result


@router.post("/events/bulk-approve")
async def bulk_approve_events(
    body: BulkEventIds,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_or_editor)
):
    """Approve multiple events at once (Admin/Editor)."""
    approved = 0
    for event_id in body.event_ids:
        try:
            event_service.approve_event(db, event_id, current_admin.id)
            audit_service.create_audit_log(db, current_admin.id, "approve", "event", event_id)
            approved += 1
        except Exception:
            pass
    return {"approved": approved, "total": len(body.event_ids)}


@router.post("/events/bulk-reject")
async def bulk_reject_events(
    body: BulkEventReject,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_or_editor)
):
    """Reject multiple events at once (Admin/Editor)."""
    rejected = 0
    for event_id in body.event_ids:
        try:
            event_service.reject_event(db, event_id, body.rejection_reason, current_admin.id)
            audit_service.create_audit_log(
                db, current_admin.id, "reject", "event", event_id,
                details={"rejection_reason": body.rejection_reason}
            )
            rejected += 1
        except Exception:
            pass
    return {"rejected": rejected, "total": len(body.event_ids)}


@router.get("/events/export/csv")
async def export_events_csv(
    status_filter: Optional[str] = Query(None),
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_editor)
):
    """Export events as CSV (Admin/Editor)."""
    events = event_service.get_events(
        db, skip=0, limit=10000,
        status_filter=status_filter,
        category_id=category_id
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "title", "organizer", "description", "start_date", "start_time", "end_date", "end_time",
        "location", "location_url", "status", "category", "submitter_name", "submitter_email"
    ])
    for e in events:
        writer.writerow([
            e.id, e.title, e.organizer or "", (e.description or "")[:500], e.start_date, e.start_time,
            e.end_date, e.end_time, e.location, e.location_url, e.status,
            e.category.name if e.category else "",
            e.submitter_name, e.submitter_email
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=events.csv"}
    )
