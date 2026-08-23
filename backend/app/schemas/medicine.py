from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MedicineDrugCreate(BaseModel):
    name: str


class MedicineTypeCreate(BaseModel):
    name: str


class MedicineBrandCreate(BaseModel):
    drug_id: int
    type_id: Optional[int]
    name: str


class MedicineDosageCreate(BaseModel):
    brand_id: int
    label: str
    default_instruction: Optional[str] = None


class MedicineItemResponse(BaseModel):
    id: int
    name: Optional[str] = None
    label: Optional[str] = None
    drug_id: Optional[int] = None
    brand_id: Optional[int] = None
    type_id: Optional[int] = None
    default_instruction: Optional[str] = None
    is_active: Optional[bool] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MedicineMasterBase(BaseModel):
    brand_name: str
    drug_name: str
    category: Optional[str] = "Tablet"
    default_dosage: Optional[str] = "1 Tab"
    default_frequency: Optional[str] = "TDS (1-1-1)"
    default_days: Optional[int] = 3
    default_instructions: Optional[str] = ""


class MedicineMasterCreate(MedicineMasterBase):
    pass


class MedicineMasterUpdate(BaseModel):
    brand_name: Optional[str] = None
    drug_name: Optional[str] = None
    category: Optional[str] = None
    default_dosage: Optional[str] = None
    default_frequency: Optional[str] = None
    default_days: Optional[int] = None
    default_instructions: Optional[str] = None


class MedicineMasterResponse(MedicineMasterBase):
    id: int
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

