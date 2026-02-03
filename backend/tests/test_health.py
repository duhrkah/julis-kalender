"""
Tests for health and root endpoints
"""


def test_root_endpoint(client):
    """Test root endpoint returns correct info"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "JuLis Calendar Event Management API"
    assert "version" in data


def test_health_endpoint(client):
    """Test health endpoint returns healthy status"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
