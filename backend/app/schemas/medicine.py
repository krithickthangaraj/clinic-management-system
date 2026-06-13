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
