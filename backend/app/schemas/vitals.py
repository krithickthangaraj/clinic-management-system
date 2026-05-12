from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class VitalsUpdate(BaseModel):
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    height_cm: Optional[float] = None
    pr: Optional[int] = None
    spo2: Optional[int] = None
    sugar: Optional[float] = None


class VitalsCreate(BaseModel):
    visit_id: int
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    temperature: Optional[float] = None   # Celsius (frontend converts from °F)
    weight: Optional[float] = None       # kg
    height_cm: Optional[float] = None
    pr: Optional[int] = None            # Pulse rate bpm
    spo2: Optional[int] = None          # SpO2 %
    sugar: Optional[float] = None


class VitalsResponse(BaseModel):
    id: int
    visit_id: int
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    height_cm: Optional[float] = None
    pr: Optional[int] = None
    spo2: Optional[int] = None
    sugar: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True
