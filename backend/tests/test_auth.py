"""
Tests for authentication endpoints
"""


def test_login_success(client, test_user):
    """Test successful login"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "testpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "testuser"


def test_login_invalid_username(client, test_user):
    """Test login with invalid username"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wronguser", "password": "testpassword123"},
    )
    assert response.status_code == 401


def test_login_invalid_password(client, test_user):
    """Test login with invalid password"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_get_me_authenticated(client, auth_headers, test_user):
    """Test getting current user info when authenticated"""
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


def test_get_me_unauthenticated(client):
    """Test getting current user info without authentication"""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_register_new_user(client):
    """Test registering a new user"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpassword123",
            "full_name": "New User"
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"


def test_register_duplicate_username(client, test_user):
    """Test registering with existing username fails"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "email": "different@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 400


def test_register_duplicate_email(client, test_user):
    """Test registering with existing email fails"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "differentuser",
            "email": "test@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 400
