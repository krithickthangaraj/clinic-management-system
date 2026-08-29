from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    subtotal = Column(Float, default=0.0, nullable=False)
    discount_amount = Column(Float, default=0.0, nullable=False)
    discount_percentage = Column(Float, default=0.0, nullable=True)
    tax_amount = Column(Float, default=0.0, nullable=False)
    grand_total = Column(Float, default=0.0, nullable=False)

    payment_mode = Column(String, default="Cash", nullable=False)  # Cash, UPI, Card, Credit
    payment_status = Column(String, default="PAID", nullable=False)  # PAID, PENDING, CANCELLED
    transaction_reference = Column(String, nullable=True)
    cashier_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    visit = relationship("Visit", backref="invoices")
    patient = relationship("Patient", backref="invoices")
    cashier = relationship("User", foreign_keys=[cashier_id])
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)

    category = Column(String, nullable=False)  # CONSULTATION, LABORATORY, PHARMACY, PROCEDURE
    item_name = Column(String, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)
    subtotal = Column(Float, default=0.0, nullable=False)

    # Relationships
    invoice = relationship("Invoice", back_populates="items")
