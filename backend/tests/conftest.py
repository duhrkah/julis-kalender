"""
Pytest configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base
from app.api.deps import get_db
from app.models.user import User
from app.core.security import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    """Create fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create test client with database override"""
    def override_get_db():
        yield db
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    """Create a test user"""
    user = User(
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        password_hash=get_password_hash("testpassword123"),
        role="user",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    user = User(
        username="admin",
        email="admin@example.com",
        full_name="Admin User",
        password_hash=get_password_hash("adminpassword123"),
        role="admin",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def user_token(client, test_user):
    """Get authentication token for test user"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "testpassword123"},
    )
    return response.json()["access_token"]


@pytest.fixture
def admin_token(client, admin_user):
    """Get authentication token for admin user"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "adminpassword123"},
    )
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(user_token):
    """Create auth headers for regular user"""
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def admin_headers(admin_token):
    """Create auth headers for admin user"""
    return {"Authorization": f"Bearer {admin_token}"}
