from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class ChiefComplaintMaster(Base):
    __tablename__ = "chief_complaints_master"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DiagnosisMaster(Base):
    __tablename__ = "diagnosis_master"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DoctorAdviceMaster(Base):
    __tablename__ = "doctor_advice_master"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LabTestMaster(Base):
    __tablename__ = "lab_tests_master"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    test_type = Column(String, nullable=False)  # 'Lab' or 'Radiology'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
