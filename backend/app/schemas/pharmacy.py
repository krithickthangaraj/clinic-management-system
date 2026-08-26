from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional, Any


class PharmacyItemBase(BaseModel):
    brand_name: str
    drug_name: str
    category: str = "Tablet"
    batch_number: str
    expiry_date: date
    stock_quantity: int = 0
    reorder_level: int = 20
    unit_price: float = 0.0


class PharmacyItemCreate(PharmacyItemBase):
    pass


class PharmacyItemUpdate(BaseModel):
    brand_name: Optional[str] = None
    drug_name: Optional[str] = None
    category: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    stock_quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    unit_price: Optional[float] = None


class PharmacyItemResponse(PharmacyItemBase):
    id: int
    is_low_stock: bool = False
    is_out_of_stock: bool = False
    is_near_expiry: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PharmacyQueueItem(BaseModel):
    visit_id: int
    queue_number: Optional[int] = None
    visit_number: str
    patient_id: str
    patient_name: str
    age_sex: str
    gender: Optional[str] = None
    age: Optional[int] = None
    doctor_name: str
    prescribed_at: Optional[datetime] = None
    items_count: int
    status: str
    pharmacy_status: str = "pending"


class PrescribedMedicineMatch(BaseModel):
    s_no: Optional[int] = 1
    brand_name: str
    drug_name: str
    dosage: str
    frequency: str
    days: int
    quantity: int
    instructions: Optional[str] = None
    
    # Matched inventory details
    matched_item_id: Optional[int] = None
    matched_brand_name: Optional[str] = None
    batch_number: Optional[str] = None
    available_stock: int = 0
    unit_price: float = 0.0
    total_price: float = 0.0
    is_in_stock: bool = True


class PharmacyPrescriptionDetails(BaseModel):
    visit_id: int
    queue_number: Optional[int] = None
    visit_number: str
    patient_id: str
    patient_name: str
    age_sex: str
    doctor_name: str
    prescribed_at: Optional[datetime] = None
    medicines: List[PrescribedMedicineMatch] = []
    total_estimated_amount: float = 0.0
    can_dispense: bool = True


class DispenseItemRequest(BaseModel):
    brand_name: str
    quantity: int
    item_id: Optional[int] = None


class DispenseRequest(BaseModel):
    payment_mode: str = "Cash"
    custom_notes: Optional[str] = None
    items: Optional[List[DispenseItemRequest]] = None


class DispenseResponse(BaseModel):
    success: bool
    message: str
    visit_id: int
    total_items_dispensed: int
    total_amount: float
    payment_mode: str
    dispensed_at: datetime


class StockReceiveRequest(BaseModel):
    quantity_to_add: int
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    unit_price: Optional[float] = None
    reference_no: Optional[str] = None  # e.g., PO #1042 / GRN #8821
    notes: Optional[str] = None


class StockAdjustmentRequest(BaseModel):
    adjustment_type: str = "deduct"  # "add", "deduct", "set"
    quantity: int
    reason: str  # "Breakage/Damage", "Physical Audit Discrepancy", "Expired Goods", "Correction", "Other"
    notes: Optional[str] = None


class PharmacyStockLogResponse(BaseModel):
    id: int
    item_id: int
    change_type: str
    quantity_change: int
    previous_stock: int
    new_stock_level: int
    reason: Optional[str] = None
    reference_no: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

