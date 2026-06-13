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
    name: Optional[str]
    label: Optional[str]
    drug_id: Optional[int]
    brand_id: Optional[int]
    type_id: Optional[int]
    default_instruction: Optional[str]
    is_active: Optional[bool]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
