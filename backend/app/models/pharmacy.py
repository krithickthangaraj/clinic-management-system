from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class PharmacyItem(Base):
    __tablename__ = "pharmacy_items"

    id = Column(Integer, primary_key=True, index=True)
    brand_name = Column(String, index=True, nullable=False)  # e.g., "Dolo 650mg Tab"
    drug_name = Column(String, index=True, nullable=False)   # e.g., "Paracetamol"
    category = Column(String, nullable=False, default="Tablet")  # Tablet, Syrup, Capsule, Injection, Ointment, Drops
    batch_number = Column(String, nullable=False)            # e.g., "BAT-2026-081"
    expiry_date = Column(Date, nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=20, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)   # Price per unit in ₹
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PharmacyDispenseLog(Base):
    __tablename__ = "pharmacy_dispense_logs"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=True)
    pharmacist_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    total_amount = Column(Float, default=0.0, nullable=False)
    payment_mode = Column(String, default="Cash", nullable=False)
    items_json = Column(Text, nullable=False)  # JSON array of dispensed items and unit prices
    dispensed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    visit = relationship("Visit")
    prescription = relationship("Prescription")
    pharmacist = relationship("User")
