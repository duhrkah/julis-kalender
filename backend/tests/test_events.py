"""
Tests for event endpoints
"""
import pytest


def test_create_event(client, auth_headers):
    """Test creating a new event"""
    response = client.post(
        "/api/v1/events",
        json={
            "title": "Test Event",
            "organizer": "Test Organizer",
            "description": "A test event description",
            "start_date": "2025-03-15",
            "start_time": "14:00",
            "end_date": "2025-03-15",
            "end_time": "16:00",
            "location": "Test Location",
            "is_public": True
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Event"
    assert data["status"] == "pending"


def test_create_event_unauthenticated(client):
    """Test creating event without authentication fails"""
    response = client.post(
        "/api/v1/events",
        json={
            "title": "Test Event",
            "organizer": "Test Organizer",
            "start_date": "2025-03-15",
        },
    )
    assert response.status_code == 401


def test_create_event_minimal_fields(client, auth_headers):
    """Test creating event with only required fields"""
    response = client.post(
        "/api/v1/events",
        json={
            "title": "Minimal Event",
            "organizer": "Minimal Organizer",
            "start_date": "2025-04-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Minimal Event"


def test_get_my_events(client, auth_headers):
    """Test getting user's own events"""
    client.post(
        "/api/v1/events",
        json={"title": "My Event", "organizer": "My Org", "start_date": "2025-03-20"},
        headers=auth_headers,
    )

    response = client.get("/api/v1/events", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(e["title"] == "My Event" for e in data)


def test_get_my_event_stats(client, auth_headers):
    """Test getting user's event stats (dashboard)"""
    response = client.get("/api/v1/events/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "pending" in data
    assert "approved" in data
    assert "rejected" in data
    assert all(isinstance(data[k], int) for k in data)


def test_get_my_event_stats_unauthenticated(client):
    """Test event stats requires authentication"""
    response = client.get("/api/v1/events/stats")
    assert response.status_code == 401


def test_get_public_events(client, db, admin_user):
    """Test getting public approved events"""
    response = client.get("/api/v1/public/events")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_approve_event_as_admin(client, auth_headers, admin_headers, db):
    """Test admin can approve an event"""
    create_response = client.post(
        "/api/v1/events",
        json={"title": "Event to Approve", "organizer": "Test Org", "start_date": "2025-05-01"},
        headers=auth_headers,
    )
    event_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/admin/events/{event_id}/approve",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"


def test_approve_event_as_user_fails(client, auth_headers, db):
    """Test regular user cannot approve events"""
    create_response = client.post(
        "/api/v1/events",
        json={"title": "Event to Approve", "organizer": "Test Org", "start_date": "2025-05-01"},
        headers=auth_headers,
    )
    event_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/admin/events/{event_id}/approve",
        headers=auth_headers,
    )
    assert response.status_code == 403


def test_reject_event_as_admin(client, auth_headers, admin_headers, db):
    """Test admin can reject an event with reason"""
    create_response = client.post(
        "/api/v1/events",
        json={"title": "Event to Reject", "organizer": "Test Org", "start_date": "2025-05-01"},
        headers=auth_headers,
    )
    event_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/admin/events/{event_id}/reject",
        json={"rejection_reason": "Incomplete information"},
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "rejected"
    assert data["rejection_reason"] == "Incomplete information"


def test_update_own_event(client, auth_headers):
    """Test user can update their own event"""
    create_response = client.post(
        "/api/v1/events",
        json={"title": "Original Title", "organizer": "Test Org", "start_date": "2025-06-01"},
        headers=auth_headers,
    )
    event_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/events/{event_id}",
        json={"title": "Updated Title"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


def test_delete_own_event(client, auth_headers):
    """Test user can delete their own event"""
    create_response = client.post(
        "/api/v1/events",
        json={"title": "Event to Delete", "organizer": "Test Org", "start_date": "2025-06-15"},
        headers=auth_headers,
    )
    event_id = create_response.json()["id"]

    response = client.delete(f"/api/v1/events/{event_id}", headers=auth_headers)
    assert response.status_code == 204
