from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Vitals(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), unique=True, nullable=False)

    # BP mmHg
    bp_systolic = Column(Integer, nullable=True)
    bp_diastolic = Column(Integer, nullable=True)
    # Temp stored in Celsius; display in Fahrenheit on frontend
    temperature = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)  # kg
    height_cm = Column(Float, nullable=True)
    # PR = Pulse rate (bpm), SpO2 %
    pr = Column(Integer, nullable=True)
    spo2 = Column(Integer, nullable=True)
    sugar = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    visit = relationship("Visit", back_populates="vitals")
