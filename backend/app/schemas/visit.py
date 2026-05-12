from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.enums import VisitStatus


class VisitCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None


class VisitUpdate(BaseModel):
    chief_complaints: Optional[List[str]] = None
    diagnosis: Optional[str] = None
    advice: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    follow_up_notes: Optional[str] = None
    status: Optional[VisitStatus] = None


class VisitResponse(BaseModel):
    id: int
    visit_number: str
    patient_id: int
    doctor_id: Optional[int]
    status: str
    chief_complaints: Optional[str]
    diagnosis: Optional[str]
    advice: Optional[str]
    follow_up_date: Optional[datetime]
    follow_up_notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    # Patient info (when loaded)
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_age_months: Optional[int] = None
    patient_gender: Optional[str] = None
    patient_phone: Optional[str] = None

    class Config:
        from_attributes = True
