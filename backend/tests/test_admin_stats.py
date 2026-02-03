"""
Tests for admin stats and audit logs endpoints
"""


def test_admin_stats_requires_admin(client, auth_headers):
    """Test that non-admin cannot access admin stats"""
    response = client.get("/api/v1/admin/stats", headers=auth_headers)
    assert response.status_code == 403


def test_admin_stats_success(client, admin_headers):
    """Test admin can get dashboard stats"""
    response = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "pending_events" in data
    assert "approved_events" in data
    assert "rejected_events" in data
    assert "categories_count" in data
    assert "users_count" in data
    assert all(isinstance(data[k], int) for k in data)


def test_admin_audit_logs_requires_admin(client, auth_headers):
    """Test that non-admin cannot access audit logs"""
    response = client.get("/api/v1/admin/audit-logs", headers=auth_headers)
    assert response.status_code == 403


def test_admin_audit_logs_success(client, admin_headers):
    """Test admin can get audit logs"""
    response = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
