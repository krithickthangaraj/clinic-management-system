from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import VisitStatus


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    visit_number = Column(String, unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default=VisitStatus.REGISTERED.value, nullable=False)
    
    # Consultation data
    consultant_assigned = Column(String, nullable=True)  # Doctor or Staff nurse assigned at reception
    chief_complaints = Column(Text, nullable=True)  # JSON array of strings
    diagnosis = Column(String, nullable=True)
    advice = Column(Text, nullable=True)
    laboratory_reports = Column(Text, nullable=True)  # Summary string e.g. "Hb: 11.3 g/dL, Creat: 0.65 mg/dL"
    follow_up_date = Column(DateTime(timezone=True), nullable=True)
    follow_up_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="visits")
    doctor = relationship("User", back_populates="visits", foreign_keys=[doctor_id])
    vitals = relationship("Vitals", back_populates="visit", uselist=False, cascade="all, delete-orphan")
    prescription = relationship("Prescription", back_populates="visit", uselist=False, cascade="all, delete-orphan")
    tests = relationship("Test", back_populates="visit", cascade="all, delete-orphan")
    visit_complaints = relationship("VisitComplaint", back_populates="visit", cascade="all, delete-orphan")
    visit_diagnosis = relationship("VisitDiagnosis", back_populates="visit", cascade="all, delete-orphan")
    payment = relationship("VisitPayment", back_populates="visit", cascade="all, delete-orphan")
