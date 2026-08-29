from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ServiceLineItem(BaseModel):
    category: str = "CONSULTATION"  # CONSULTATION, LABORATORY, PHARMACY, PROCEDURE
    item_name: str
    quantity: int = 1
    unit_price: float = 0.0
    subtotal: float = 0.0

    class Config:
        from_attributes = True


class POSBillingRollupSummary(BaseModel):
    visit_id: int
    patient_id: int
    uhid: str
    patient_name: str
    age_sex: Optional[str] = ""
    doctor_name: Optional[str] = ""
    consultation_fee: float = 0.0
    lab_total: float = 0.0
    pharmacy_total: float = 0.0
    gross_total: float = 0.0
    line_items: List[ServiceLineItem] = Field(default_factory=list)

    class Config:
        from_attributes = True


class InvoiceSettlementPayload(BaseModel):
    visit_id: int
    patient_id: int
    items: List[ServiceLineItem] = Field(default_factory=list)
    subtotal: float
    discount_amount: float = 0.0
    discount_percentage: Optional[float] = 0.0
    tax_amount: float = 0.0
    grand_total: float
    payment_mode: str = "Cash"  # Cash, UPI, Card, Credit
    transaction_reference: Optional[str] = None
    cashier_notes: Optional[str] = None

    class Config:
        from_attributes = True


class InvoiceItemResponse(BaseModel):
    id: int
    invoice_id: int
    category: str
    item_name: str
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    visit_id: int
    patient_id: int
    cashier_id: Optional[int] = None
    subtotal: float
    discount_amount: float = 0.0
    discount_percentage: Optional[float] = 0.0
    tax_amount: float = 0.0
    grand_total: float
    payment_mode: str = "Cash"
    payment_status: str = "PAID"
    transaction_reference: Optional[str] = None
    cashier_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    items: List[InvoiceItemResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
