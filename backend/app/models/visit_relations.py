from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class VisitComplaint(Base):
    __tablename__ = "visit_complaints"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False, index=True)
    complaint_id = Column(Integer, ForeignKey("chief_complaints_master.id"), nullable=True)
    custom_complaint = Column(String, nullable=True)  # For non-master complaints
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    visit = relationship("Visit", back_populates="visit_complaints")
    complaint = relationship("ChiefComplaintMaster")


class VisitDiagnosis(Base):
    __tablename__ = "visit_diagnosis"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False, index=True)
    diagnosis_id = Column(Integer, ForeignKey("diagnosis_master.id"), nullable=True)
    custom_diagnosis = Column(String, nullable=True)  # For non-master diagnosis
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    visit = relationship("Visit", back_populates="visit_diagnosis")
    diagnosis = relationship("DiagnosisMaster")


class VisitPayment(Base):
    __tablename__ = "visit_payments"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False, unique=True, index=True)
    doctor_fee = Column(Float, nullable=True, default=0.0)
    lab_fee = Column(Float, nullable=True, default=0.0)
    total = Column(Float, nullable=True, default=0.0)
    payment_status = Column(String, default="pending")  # 'pending' or 'paid'
    payment_mode = Column(String, nullable=True)  # 'cash', 'card', 'upi', etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    visit = relationship("Visit", back_populates="payment", uselist=False)
