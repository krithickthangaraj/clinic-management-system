from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    guardian_name = Column(String, nullable=True)
    phone = Column(String, nullable=False, index=True)
    age_years = Column(Integer, nullable=True)  # age in years
    age_months = Column(Integer, nullable=True)  # 0-11, for "X years Y months"
    gender = Column(String, nullable=False)
    address = Column(Text, nullable=True)
    district = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # Legacy: kept for backward compatibility, prefer age_years
    age = Column(Integer, nullable=True)

    # Relationships
    visits = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")
    allergy_history = relationship("PatientAllergyHistory", back_populates="patient", cascade="all, delete-orphan")
    family_history = relationship("PatientFamilyHistory", back_populates="patient", cascade="all, delete-orphan")
    surgical_history = relationship("PatientSurgicalHistory", back_populates="patient", cascade="all, delete-orphan")
    past_history = relationship("PatientPastHistory", back_populates="patient", cascade="all, delete-orphan")
