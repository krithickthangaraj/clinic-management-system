from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Vitals(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), unique=True, nullable=False)

    # Hospital Sheet Vitals
    weight_kg = Column(Float, nullable=True)  # Max 200
    height_cm = Column(Float, nullable=True)  # Max 250
    bmi = Column(Float, nullable=True)  # Auto-calculated, up to 1 decimal
    blood_pressure = Column(String, nullable=True)  # e.g., "110/80"
    temperature_f = Column(Float, nullable=True)  # e.g., 98.5
    spo2_percent = Column(Integer, nullable=True)  # Max 100
    pulse_rate_bpm = Column(Integer, nullable=True)  # e.g., 82
    grbs_mg_dl = Column(Integer, nullable=True)  # Random blood sugar (e.g. 129)
    consultant_assigned = Column(String, nullable=True)  # Doctor or Staff nurse
    remarks = Column(Text, nullable=True)  # e.g., "Inj.Para, Levolin 1.25 Neb"

    # Legacy fields for backward compatibility
    bp_systolic = Column(Integer, nullable=True)
    bp_diastolic = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)  # Stored in Celsius
    weight = Column(Float, nullable=True)  # kg
    pr = Column(Integer, nullable=True)
    spo2 = Column(Integer, nullable=True)
    sugar = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    visit = relationship("Visit", back_populates="vitals")

