from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class VisitComplaintCreate(BaseModel):
    complaint_id: Optional[int] = None
    custom_complaint: Optional[str] = None


class ComplaintMasterRef(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class VisitComplaintResponse(BaseModel):
    id: int
    visit_id: int
    complaint_id: Optional[int] = None
    custom_complaint: Optional[str] = None
    created_at: datetime
    complaint: Optional[ComplaintMasterRef] = None

    class Config:
        from_attributes = True


class VisitDiagnosisCreate(BaseModel):
    diagnosis_id: Optional[int] = None
    custom_diagnosis: Optional[str] = None


class DiagnosisMasterRef(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class VisitDiagnosisResponse(BaseModel):
    id: int
    visit_id: int
    diagnosis_id: Optional[int] = None
    custom_diagnosis: Optional[str] = None
    created_at: datetime
    diagnosis: Optional[DiagnosisMasterRef] = None

    class Config:
        from_attributes = True


class VisitPaymentCreate(BaseModel):
    doctor_fee: Optional[float] = 0.0
    lab_fee: Optional[float] = 0.0
    payment_status: Optional[str] = "pending"
    payment_mode: Optional[str] = None


class VisitPaymentUpdate(BaseModel):
    doctor_fee: Optional[float] = None
    lab_fee: Optional[float] = None
    total: Optional[float] = None
    payment_status: Optional[str] = None
    payment_mode: Optional[str] = None


class VisitPaymentResponse(BaseModel):
    id: int
    visit_id: int
    doctor_fee: float
    lab_fee: float
    total: float
    payment_status: str
    payment_mode: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
