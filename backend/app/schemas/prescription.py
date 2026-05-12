from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional


class PrescriptionDrugCreate(BaseModel):
    drug_name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    start_date: date
    number_of_days: int
    end_date: date
    quantity: int


class PrescriptionDrugResponse(BaseModel):
    id: int
    drug_name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    start_date: date
    number_of_days: int
    end_date: date
    quantity: int

    class Config:
        from_attributes = True


class PrescriptionCreate(BaseModel):
    visit_id: int
    drugs: List[PrescriptionDrugCreate]


class PrescriptionResponse(BaseModel):
    id: int
    visit_id: int
    doctor_id: int
    created_at: datetime
    printed_at: Optional[datetime]
    drugs: List[PrescriptionDrugResponse]

    class Config:
        from_attributes = True
