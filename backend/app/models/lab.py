from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, synonym
from sqlalchemy.sql import func
from app.core.database import Base


class LabTestMaster(Base):
    __tablename__ = "lab_test_master"

    id = Column(Integer, primary_key=True, index=True)
    test_name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, nullable=False, default="Pathology")  # Hematology, Biochemistry, Serology, Pathology, Radiology, Clinical Pathology
    normal_range = Column(String, nullable=True)  # e.g., "13.0 - 17.0", "70 - 100", "0.6 - 1.2"
    unit = Column(String, nullable=True)  # e.g., "g/dL", "mg/dL", "U/L", "cells/cu.mm", "%", "µIU/mL"
    price = Column(Float, nullable=False, default=0.0)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Aliases for compatibility
    name = synonym("test_name")
    test_type = synonym("category")


class LabOrder(Base):
    __tablename__ = "lab_orders"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    status = Column(String, default="PENDING", nullable=False, index=True)  # PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    total_amount = Column(Float, default=0.0, nullable=False)
    summary_results = Column(Text, nullable=True)  # Formatted string e.g. "Hb: 11.3 g/dL, Creat: 0.65 mg/dL"
    
    ordered_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    visit = relationship("Visit", foreign_keys=[visit_id])
    patient = relationship("Patient", foreign_keys=[patient_id])
    technician = relationship("User", foreign_keys=[technician_id])
    results = relationship("LabResult", back_populates="order", cascade="all, delete-orphan")


class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True)
    lab_order_id = Column(Integer, ForeignKey("lab_orders.id"), nullable=False, index=True)
    test_id = Column(Integer, ForeignKey("lab_test_master.id"), nullable=False)
    
    test_name = Column(String, nullable=False)
    result_value = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    normal_range = Column(String, nullable=True)
    is_abnormal = Column(Boolean, default=False, nullable=False)
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("LabOrder", back_populates="results")
    test_master = relationship("LabTestMaster", foreign_keys=[test_id])
