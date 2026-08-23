from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class HospitalSettings(Base):
    __tablename__ = "hospital_settings"

    id = Column(Integer, primary_key=True, index=True)
    hospital_name = Column(String(255), default="KONGU HOSPITAL", nullable=False)
    tagline = Column(String(255), default="Consultant Physician and Diabetologist", nullable=True)
    logo_url = Column(Text, nullable=True)
    address = Column(Text, default="4 Roads, Veppadai, Komarapalayam, Namakkal - 638008.", nullable=True)
    phone = Column(String(50), default="+91 98765 43210", nullable=True)
    email = Column(String(100), default="contact@konguhospital.com", nullable=True)
    website = Column(String(100), default="www.konguhospital.com", nullable=True)
    registration_number = Column(String(100), default="82047", nullable=True)

    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
