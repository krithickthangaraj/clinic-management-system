from sqlalchemy import Column, Integer, String, Text, DateTime, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, unique=True, index=True, nullable=True)  # e.g., PAT-10001
    barcode = Column(String, index=True, nullable=True)  # scanner input
    registration_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    name = Column(String, nullable=False, index=True)
    dob = Column(Date, nullable=True)
    age = Column(Integer, nullable=True)
    age_format = Column(String, default="Years", nullable=True)  # Years, Months, Days
    age_years = Column(Integer, nullable=True)  # legacy compatibility
    age_months = Column(Integer, nullable=True)  # 0-11
    gender = Column(String, nullable=False)  # Male, Female, Others
    guardian_name = Column(String, nullable=True)
    guardian_relation = Column(String, nullable=True)  # S/o, D/o, W/o, B/o, C/o
    address = Column(Text, nullable=True)
    district = Column(String, nullable=True)
    phone = Column(String, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def full_name(self) -> str:
        return self.name

    @full_name.setter
    def full_name(self, value: str):
        self.name = value

    @property
    def phone_number(self) -> str:
        return self.phone

    @phone_number.setter
    def phone_number(self, value: str):
        self.phone = value

    # Relationships
    visits = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")
    allergy_history = relationship("PatientAllergyHistory", back_populates="patient", cascade="all, delete-orphan")
    family_history = relationship("PatientFamilyHistory", back_populates="patient", cascade="all, delete-orphan")
    surgical_history = relationship("PatientSurgicalHistory", back_populates="patient", cascade="all, delete-orphan")
    past_history = relationship("PatientPastHistory", back_populates="patient", cascade="all, delete-orphan")

