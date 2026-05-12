from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False)  # e.g., "Fever", "Cold", "Diabetes"
    chief_complaints = Column(Text, nullable=True)  # JSON array
    diagnosis = Column(String, nullable=True)
    advice = Column(Text, nullable=True)
    drugs = Column(Text, nullable=False)  # JSON array of drug objects
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    doctor = relationship("User")
