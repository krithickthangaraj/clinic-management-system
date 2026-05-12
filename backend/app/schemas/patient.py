from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PatientCreate(BaseModel):
    name: str
    guardian_name: Optional[str] = None
    phone: str
    age_years: int
    age_months: int = 0
    gender: str  # male, female, other
    address: Optional[str] = None
    district: Optional[str] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    guardian_name: Optional[str] = None
    phone: Optional[str] = None
    age_years: Optional[int] = None
    age_months: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None


class PatientResponse(BaseModel):
    id: int
    name: str
    guardian_name: Optional[str] = None
    phone: str
    age: Optional[int] = None
    age_years: Optional[int] = None
    age_months: Optional[int] = None
    gender: str
    address: Optional[str] = None
    district: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
