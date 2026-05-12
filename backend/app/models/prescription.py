from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), unique=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    printed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    visit = relationship("Visit", back_populates="prescription")
    doctor = relationship("User", back_populates="prescriptions")
    drugs = relationship("PrescriptionDrug", back_populates="prescription", cascade="all, delete-orphan")


class PrescriptionDrug(Base):
    __tablename__ = "prescription_drugs"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    
    drug_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)  # e.g., "250mg", "500mg"
    frequency = Column(String, nullable=False)  # e.g., "1-0-1", "1-1-1" or "OD", "BD", "TDS", etc.
    instructions = Column(Text, nullable=True)  # e.g., "After food", "Before sleep"
    start_date = Column(Date, nullable=False)
    number_of_days = Column(Integer, nullable=False)
    end_date = Column(Date, nullable=False)
    quantity = Column(Integer, nullable=False)  # Auto-calculated
    
    # Relationships
    prescription = relationship("Prescription", back_populates="drugs")
