from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class LabTestMasterResponse(BaseModel):
    id: int
    test_name: str
    category: str
    normal_range: Optional[str] = None
    unit: Optional[str] = None
    price: float = 0.0
    is_active: bool = True

    class Config:
        from_attributes = True


class LabTestMasterCreate(BaseModel):
    test_name: str = Field(..., min_length=1)
    category: str = "Pathology"
    normal_range: Optional[str] = None
    unit: Optional[str] = None
    price: float = 0.0


class LabTestMasterUpdate(BaseModel):
    test_name: Optional[str] = None
    category: Optional[str] = None
    normal_range: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None


class LabQueueItem(BaseModel):
    visit_id: int
    visit_number: str
    patient_id: str
    patient_name: str
    age_sex: str
    doctor_name: str
    ordered_at: Optional[datetime] = None
    prescribed_tests: List[str] = []
    tests_count: int = 0
    status: str = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED


class LabResultItem(BaseModel):
    test_id: int
    test_name: str
    result_value: str
    unit: Optional[str] = None
    normal_range: Optional[str] = None
    is_abnormal: bool = False
    notes: Optional[str] = None


class LabParameterEntry(BaseModel):
    parameter_name: str
    observed_value: str
    unit: Optional[str] = ""
    reference_range_low: Optional[float] = None
    reference_range_high: Optional[float] = None
    reference_range: Optional[str] = None
    flag: Optional[str] = "NORMAL"  # NORMAL, LOW, HIGH, CRITICAL


class LabOrderFinalizePayload(BaseModel):
    order_id: Optional[int] = None
    visit_id: Optional[int] = None
    test_name: Optional[str] = "Lab Investigation"
    parameters: Optional[List[LabParameterEntry]] = []
    results: Optional[List[LabResultItem]] = None  # legacy compatibility
    technician_remarks: Optional[str] = None
    result_summary: Optional[str] = None
    pdf_attachment_url: Optional[str] = None
    payment_mode: Optional[str] = "Cash"
    notes: Optional[str] = None


class LabOrderFinalizeRequest(BaseModel):
    visit_id: int
    results: Optional[List[LabResultItem]] = []
    parameters: Optional[List[LabParameterEntry]] = []
    test_name: Optional[str] = "Lab Investigation"
    result_summary: Optional[str] = None
    pdf_attachment_url: Optional[str] = None
    payment_mode: Optional[str] = "Cash"
    notes: Optional[str] = None
    technician_remarks: Optional[str] = None


class LabResultResponse(BaseModel):
    id: int
    test_id: int
    test_name: str
    result_value: str
    unit: Optional[str] = None
    normal_range: Optional[str] = None
    is_abnormal: bool = False
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class LabOrderDetailsResponse(BaseModel):
    visit_id: int
    visit_number: str
    patient_id: str
    patient_name: str
    age_sex: str
    doctor_name: str
    status: str
    prescribed_tests: List[str] = []
    available_tests: List[LabTestMasterResponse] = []
    existing_results: List[LabResultResponse] = []
    summary_results: Optional[str] = None
    total_amount: float = 0.0


class LabOrderFinalizeResponse(BaseModel):
    success: bool
    message: str
    order_id: int
    visit_id: int
    patient_name: str
    summary_results: str
    total_tests_processed: int
    total_abnormal_flags: int
    total_amount: float
    completed_at: datetime
