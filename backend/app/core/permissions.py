"""Role-based access control utilities"""
from app.models.user import User


def is_admin(user: User) -> bool:
    """
    Check if user has admin role

    Args:
        user: User model instance

    Returns:
        bool: True if user is admin
    """
    return user.role == "admin"


def can_edit_event(user: User, event_submitter_id: int) -> bool:
    """
    Check if user can edit an event

    Args:
        user: User model instance
        event_submitter_id: ID of the event submitter

    Returns:
        bool: True if user can edit the event
    """
    return is_admin(user) or user.id == event_submitter_id


def can_delete_event(user: User, event_submitter_id: int) -> bool:
    """
    Check if user can delete an event

    Args:
        user: User model instance
        event_submitter_id: ID of the event submitter

    Returns:
        bool: True if user can delete the event
    """
    return is_admin(user) or user.id == event_submitter_id
