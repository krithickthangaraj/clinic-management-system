from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.enums import TestStatus


class TestCreate(BaseModel):
    visit_id: int
    test_type: str
    test_name: str


class TestUpdate(BaseModel):
    status: Optional[TestStatus] = None
    results: Optional[str] = None
    report_url: Optional[str] = None


class TestResponse(BaseModel):
    id: int
    visit_id: int
    test_type: str
    test_name: str
    status: str
    results: Optional[str]
    report_url: Optional[str]
    ordered_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
