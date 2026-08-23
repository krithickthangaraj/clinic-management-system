from pydantic import BaseModel, field_validator
from datetime import date, datetime, time
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

    @field_validator("follow_up_date", mode="before")
    @classmethod
    def parse_follow_up_date(cls, value):
        if value in (None, ""):
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, date):
            return datetime.combine(value, time.min)
        if isinstance(value, str):
            trimmed = value.strip()
            if not trimmed:
                return None
            if len(trimmed) == 10 and trimmed[4] == "-" and trimmed[7] == "-":
                return datetime.fromisoformat(f"{trimmed}T00:00:00")
        return value


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
    consultant_assigned: Optional[str] = None
    laboratory_reports: Optional[str] = None

    class Config:
        from_attributes = True


class DoctorDashboardKPIs(BaseModel):
    total_patients: int = 0
    waiting: int = 0
    followup: int = 0
    reports_pending: int = 0
    not_attended: int = 0
    completed: int = 0


class QueuePatientItem(BaseModel):
    queue_no: int
    visit_id: int
    visit_number: str
    patient_id: str
    numeric_patient_id: int
    patient_name: str
    age_sex: str  # e.g., "44 Yrs / M"
    age: Optional[int] = None
    gender: Optional[str] = None
    category: str = "OPD"  # General, OPD, Follow-up, Emergency, Review
    waiting_time: str = "0 min"  # e.g., "20 min"
    waiting_minutes: int = 0
    remarks: Optional[str] = None
    status: str
    consultant_assigned: Optional[str] = None
    lab_results_ready: bool = False
    laboratory_reports: Optional[str] = None
    created_at: datetime


class DoctorDashboardResponse(BaseModel):
    kpis: DoctorDashboardKPIs
    queue: List[QueuePatientItem]
    date: str

