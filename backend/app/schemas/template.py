from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any

class TemplateCreate(BaseModel):
    name: str
    chief_complaints: Optional[List[str]] = None
    diagnosis: Optional[str] = None
    advice: Optional[str] = None
    drugs: List[Any]  # List of drug objects

class TemplateResponse(BaseModel):
    id: int
    doctor_id: int
    name: str
    chief_complaints: Optional[str]
    diagnosis: Optional[str]
    advice: Optional[str]
    drugs: str
    created_at: datetime

    class Config:
        from_attributes = True
