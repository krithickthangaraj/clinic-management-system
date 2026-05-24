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
    
    # Vitals (for template defaults)
    vitals = Column(Text, nullable=True)  # JSON object with bp_s, bp_d, temp, wt, ht, sugar, pr, spo2
    
    # Investigation/Tests
    tests = Column(Text, nullable=True)  # JSON array of test objects
    
    # Follow-up settings
    follow_up_date = Column(String, nullable=True)  # ISO date string or relative (e.g., "+7d")
    follow_up_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    doctor = relationship("User")
