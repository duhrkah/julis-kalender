"""AuditLog SQLAlchemy model"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class AuditLog(Base):
    """Audit log model for tracking admin actions"""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)  # 'approve', 'reject', 'delete', etc.
    entity_type = Column(String(50), nullable=False, index=True)  # 'event', 'user', 'category'
    entity_id = Column(Integer, nullable=True, index=True)
    details = Column(Text, nullable=True)  # JSON with additional context
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, action='{self.action}', entity_type='{self.entity_type}')>"
