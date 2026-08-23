from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# --- Hospital Settings ---
class HospitalSettingsBase(BaseModel):
    hospital_name: str = "AEREN CLINIC & HEALTHCARE"
    tagline: Optional[str] = "Excellence in Outpatient Healthcare & Diagnostics"
    logo_url: Optional[str] = None
    address: Optional[str] = "123 Medical Center Road, Central Healthcare District"
    phone: Optional[str] = "+91 98765 43210"
    email: Optional[str] = "contact@aerenclinic.com"
    website: Optional[str] = "www.aerenclinic.com"
    registration_number: Optional[str] = "REG-TN-2024-8849"


class HospitalSettingsUpdate(HospitalSettingsBase):
    pass


class HospitalSettingsResponse(HospitalSettingsBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Staff Management ---
class StaffCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    qualification: Optional[str] = None


class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    qualification: Optional[str] = None
    is_active: Optional[bool] = None


class StaffPasswordReset(BaseModel):
    new_password: str


class StaffResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    department: Optional[str] = None
    qualification: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- User Profile ---
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# --- Clinical Dictionary Term ---
class DictionaryTermCreate(BaseModel):
    name: str
    specialty: Optional[str] = None
    test_type: Optional[str] = None


class DictionaryTermUpdate(BaseModel):
    name: str
    specialty: Optional[str] = None
    test_type: Optional[str] = None


class DictionaryTermResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    specialty: Optional[str] = None
    test_type: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
