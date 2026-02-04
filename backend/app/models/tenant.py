"""Tenant SQLAlchemy model for multi-tenancy support"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class TenantLevel(str, enum.Enum):
    """Tenant hierarchy levels"""
    BUNDESVERBAND = "bundesverband"  # Federal level - sees all data
    LANDESVERBAND = "landesverband"  # State level - has own instance
    BEZIRKSVERBAND = "bezirksverband"  # District level


class Tenant(Base):
    """
    Tenant model for multi-tenancy support.
    
    Hierarchy:
    - Bundesverband (top level, parent_id = null) - aggregates all events
    - Landesverband (16 state associations) - own instance with own users/categories
    - Bezirksverband (district associations) - grouped under Landesverband
    """

    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)  # URL-friendly identifier
    description = Column(Text, nullable=True)
    
    # Hierarchy
    level = Column(String(50), nullable=False, default=TenantLevel.LANDESVERBAND.value)
    parent_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Settings
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Branding (optional)
    logo_url = Column(String(500), nullable=True)
    primary_color = Column(String(7), nullable=True)  # Hex color like #FF5733
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    parent = relationship("Tenant", remote_side=[id], backref="children")
    users = relationship("User", back_populates="tenant")
    events = relationship("Event", back_populates="tenant")
    categories = relationship("Category", back_populates="tenant")

    def __repr__(self):
        return f"<Tenant(id={self.id}, name='{self.name}', level='{self.level}')>"

    def is_bundesverband(self) -> bool:
        """Check if this tenant is the federal level (can see all data)"""
        return self.level == TenantLevel.BUNDESVERBAND.value

    def get_all_child_ids(self, db) -> list:
        """
        Recursively get all child tenant IDs.
        Used for aggregated views at Bundesverband level.
        """
        child_ids = []
        for child in self.children:
            child_ids.append(child.id)
            child_ids.extend(child.get_all_child_ids(db))
        return child_ids

    def can_view_tenant(self, other_tenant_id: int, db) -> bool:
        """
        Check if this tenant can view data from another tenant.
        - Bundesverband can see all
        - Landesverband can see own and children (Bezirksverbände)
        - Bezirksverband can only see own
        """
        if self.is_bundesverband():
            return True
        if self.id == other_tenant_id:
            return True
        return other_tenant_id in self.get_all_child_ids(db)
