from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PatientHistoryCreate(BaseModel):
    patient_id: int
    value: str
    is_active: Optional[bool] = True


class PatientHistoryResponse(BaseModel):
    id: int
    patient_id: int
    value: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
