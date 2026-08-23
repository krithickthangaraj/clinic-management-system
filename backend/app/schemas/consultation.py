from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict, Union
from datetime import date, datetime
from enum import Enum


class FrequencyEnum(str, Enum):
    OD = "OD (1-0-0)"
    BD = "BD (1-0-1)"
    TDS = "TDS (1-1-1)"
    QID = "QID (1-1-1-1)"
    HS = "HS (0-0-1)"
    SOS = "SOS (As needed)"
    STAT = "STAT (Immediately)"
    QW = "QW (Once weekly)"


class InstructionEnum(str, Enum):
    AFTER_FOOD = "After food"
    BEFORE_FOOD = "Before food"
    WITH_FOOD = "With food"
    EMPTY_STOMACH = "Empty stomach"
    AT_BEDTIME = "At bedtime"


# ---------------------------------------------------------------------------
# 1. RX Medication Item Schema
# ---------------------------------------------------------------------------
class RXDrugItem(BaseModel):
    s_no: Optional[int] = 1
    brand_name: Optional[str] = None
    drug_name: str
    dosage: Optional[str] = "1 Tab"
    frequency: Optional[str] = "TDS (1-1-1)"
    days: Optional[int] = 5
    instructions: Optional[str] = "After food"
    quantity: Optional[int] = 15

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# 2. Patient History Schema
# ---------------------------------------------------------------------------
class PatientHistoryPayload(BaseModel):
    past_history: List[str] = Field(default_factory=list)
    allergy_history: List[str] = Field(default_factory=list)
    personal_history: List[str] = Field(default_factory=list)
    family_history: List[str] = Field(default_factory=list)
    surgical_history: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# 3. Clinical Assessment Schema
# ---------------------------------------------------------------------------
class ClinicalAssessmentPayload(BaseModel):
    complaints: List[Any] = Field(default_factory=list)
    duration: Optional[str] = None
    duration_value: Optional[Any] = None
    duration_unit: Optional[str] = None
    diagnosis: List[str] = Field(default_factory=list)
    examination: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# 4. Plan, Billing & Follow-up Schema
# ---------------------------------------------------------------------------
class BillingAndPlanPayload(BaseModel):
    lab_reports_reviewed: Optional[str] = None
    investigations_next_visit: List[str] = Field(default_factory=list)
    procedure: Optional[str] = None
    referral: Optional[str] = None
    notes: Optional[str] = None
    advice: Optional[str] = None
    
    # Follow-up
    for_followup: bool = False
    followup_duration: Optional[Any] = None
    followup_unit: Optional[str] = "Days"
    followup_date: Optional[Any] = None  # String, date or None
    
    # Billing Breakdown
    doctor_fee: Optional[float] = 0.0
    dressing_fee: Optional[float] = 0.0
    procedure_fee: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0
    payment_mode: Optional[str] = "Cash"
    payment_status: Optional[str] = "paid"

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# 5. Full Prescription Submission Payload
# ---------------------------------------------------------------------------
class FullPrescriptionPayload(BaseModel):
    visit_id: int
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    consultant_name: Optional[str] = None
    
    vitals_override: Optional[Dict[str, Any]] = None
    history: PatientHistoryPayload = Field(default_factory=PatientHistoryPayload)
    assessment: ClinicalAssessmentPayload = Field(default_factory=ClinicalAssessmentPayload)
    medicines: List[RXDrugItem] = Field(default_factory=list)
    plan_and_billing: BillingAndPlanPayload = Field(default_factory=BillingAndPlanPayload)
    
    status_action: Optional[str] = "completed"
    print_requested: Optional[bool] = False

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# 6. Full Prescription Response Schema
# ---------------------------------------------------------------------------
class FullPrescriptionResponse(BaseModel):
    prescription_id: Optional[int] = None
    visit_id: int
    patient_id: Optional[int] = None
    visit_number: Optional[str] = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    printed_at: Optional[datetime] = None
    
    history: Optional[PatientHistoryPayload] = Field(default_factory=PatientHistoryPayload)
    assessment: Optional[ClinicalAssessmentPayload] = Field(default_factory=ClinicalAssessmentPayload)
    medicines: List[RXDrugItem] = Field(default_factory=list)
    plan_and_billing: Optional[BillingAndPlanPayload] = Field(default_factory=BillingAndPlanPayload)
    status: Optional[str] = "completed"

    class Config:
        from_attributes = True
