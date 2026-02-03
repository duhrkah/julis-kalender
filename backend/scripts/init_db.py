#!/usr/bin/env python3
"""Database initialization script"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import Base, engine
from app.models import User, Category, Event, AuditLog
from app.core.security import get_password_hash

def init_db():
    """Initialize database with tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")

if __name__ == "__main__":
    init_db()
