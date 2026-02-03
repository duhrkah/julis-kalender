"""Audit log service for tracking admin actions"""
import json
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[dict] = None,
) -> AuditLog:
    """
    Create an audit log entry.

    Args:
        db: Database session
        user_id: ID of the admin user performing the action
        action: Action type (e.g. 'approve', 'reject', 'create', 'update', 'delete')
        entity_type: Type of entity ('event', 'user', 'category')
        entity_id: ID of the affected entity (optional)
        details: Additional context as dict (optional, stored as JSON)

    Returns:
        AuditLog: Created audit log entry
    """
    details_json = json.dumps(details) if details else None
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details_json,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
) -> List[AuditLog]:
    """
    Get audit logs with optional filters.

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        user_id: Filter by admin user ID
        action: Filter by action type
        entity_type: Filter by entity type

    Returns:
        List[AuditLog]: List of audit log entries (with user loaded)
    """
    query = db.query(AuditLog).options(joinedload(AuditLog.user)).order_by(AuditLog.created_at.desc())
    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    return query.offset(skip).limit(limit).all()
