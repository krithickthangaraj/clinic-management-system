from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class PatientFlowDataPoint(BaseModel):
    date: str  # YYYY-MM-DD
    day_label: str  # e.g., "Aug 17", "Mon"
    patient_count: int
    completed_count: int


class DepartmentBottlenecks(BaseModel):
    avg_wait_time_minutes: float  # Registration to Consultation Start
    avg_consultation_time_minutes: float  # Consultation Start to Completion
    avg_lab_turnaround_minutes: float  # Lab Order to Completion


class TopItemFrequency(BaseModel):
    name: str
    count: int
    percentage: Optional[float] = None


class OperationalAnalyticsResponse(BaseModel):
    patient_flow_7d: List[PatientFlowDataPoint]
    bottlenecks: DepartmentBottlenecks
    top_prescribed_drugs: List[TopItemFrequency]
    top_diagnoses: List[TopItemFrequency]
    total_patients_7d: int
    total_completed_7d: int


class DailyOPItem(BaseModel):
    token_number: str
    visit_id: int
    patient_custom_id: Optional[str] = None
    patient_name: str
    age: Optional[int] = None
    age_format: Optional[str] = "Years"
    gender: str
    phone: str
    doctor_name: Optional[str] = None
    status: str
    registered_at: str
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None


class DailyOPReportResponse(BaseModel):
    report_date: str
    total_registered: int
    total_completed: int
    total_pending: int
    items: List[DailyOPItem]
