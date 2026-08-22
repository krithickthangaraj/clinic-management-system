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
    
    s_no = Column(Integer, nullable=True)
    brand_name = Column(String, nullable=True)
    drug_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)  # e.g., "1 Tab", "500mg"
    frequency = Column(String, nullable=False)  # e.g., "TDS (1-1-1)", "1-0-1"
    instructions = Column(Text, nullable=True)  # e.g., "After food"
    start_date = Column(Date, nullable=True)
    number_of_days = Column(Integer, nullable=True)
    end_date = Column(Date, nullable=True)
    quantity = Column(Integer, nullable=True)  # Auto-calculated
    
    # Relationships
    prescription = relationship("Prescription", back_populates="drugs")
