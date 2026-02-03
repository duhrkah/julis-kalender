"""Category SQLAlchemy model"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Category(Base):
    """Category model for event categorization"""

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    color = Column(String(7), nullable=False)  # Hex color like #FF5733
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    creator = relationship("User", back_populates="created_categories")
    events = relationship("Event", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', color='{self.color}')>"
