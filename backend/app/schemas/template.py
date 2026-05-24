from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any

class TemplateCreate(BaseModel):
    name: str
    chief_complaints: Optional[List[str]] = None
    diagnosis: Optional[str] = None
    advice: Optional[str] = None
    drugs: List[Any]  # List of drug objects
    vitals: Optional[Any] = None  # JSON object with vitals defaults
    tests: Optional[List[Any]] = None  # List of test objects
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    chief_complaints: Optional[List[str]] = None
    diagnosis: Optional[str] = None
    advice: Optional[str] = None
    drugs: Optional[List[Any]] = None
    vitals: Optional[Any] = None
    tests: Optional[List[Any]] = None
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None

class TemplateResponse(BaseModel):
    id: int
    doctor_id: int
    name: str
    chief_complaints: Optional[str]
    diagnosis: Optional[str]
    advice: Optional[str]
    drugs: str
    vitals: Optional[str] = None
    tests: Optional[str] = None
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
