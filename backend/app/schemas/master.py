from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MasterItemCreate(BaseModel):
    name: str
    test_type: Optional[str] = None  # Only for lab tests


class MasterItemUpdate(BaseModel):
    name: str
    test_type: Optional[str] = None  # Only for lab tests


class MasterItemResponse(BaseModel):
    id: int
    name: str
    test_type: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
