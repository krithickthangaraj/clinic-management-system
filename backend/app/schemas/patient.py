from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime, date
from typing import Optional
import re


class PatientCreate(BaseModel):
    # Demographics
    patient_id: Optional[str] = None  # Auto-generated if not provided
    barcode: Optional[str] = None
    registration_timestamp: Optional[datetime] = None

    full_name: Optional[str] = None
    name: Optional[str] = None  # Compatible with both name & full_name

    dob: Optional[date] = None
    age: Optional[int] = None
    age_format: Optional[str] = "Years"  # 'Years', 'Months', 'Days'
    age_years: Optional[int] = None
    age_months: Optional[int] = 0

    gender: str = "Male"  # 'Male', 'Female', 'Others'
    guardian_name: Optional[str] = None
    guardian_relation: Optional[str] = None  # 'S/o', 'D/o', 'W/o', 'B/o', 'C/o'
    address: Optional[str] = None
    district: Optional[str] = None
    
    phone_number: Optional[str] = None
    phone: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_patient_fields(cls, values):
        if not isinstance(values, dict):
            return values
        # Handle full_name / name
        name_val = values.get("full_name") or values.get("name")
        if not name_val:
            raise ValueError("Patient full name is required")
        values["name"] = name_val.strip()
        values["full_name"] = name_val.strip()

        # Handle phone / phone_number
        phone_val = values.get("phone_number") or values.get("phone")
        if not phone_val:
            raise ValueError("Phone number is required")
        # Extract digits
        clean_phone = re.sub(r"\D", "", str(phone_val))
        if len(clean_phone) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        values["phone"] = clean_phone
        values["phone_number"] = clean_phone

        # Handle age sync
        if values.get("age") is not None and values.get("age_years") is None:
            values["age_years"] = int(values["age"])
        elif values.get("age_years") is not None and values.get("age") is None:
            values["age"] = int(values["age_years"])

        # Handle gender normalization
        g = str(values.get("gender", "Male")).capitalize()
        if g in ["Male", "M"]:
            values["gender"] = "Male"
        elif g in ["Female", "F"]:
            values["gender"] = "Female"
        else:
            values["gender"] = "Others"

        return values


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    name: Optional[str] = None
    patient_id: Optional[str] = None
    barcode: Optional[str] = None
    dob: Optional[date] = None
    age: Optional[int] = None
    age_format: Optional[str] = None
    age_years: Optional[int] = None
    age_months: Optional[int] = None
    gender: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_relation: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    phone_number: Optional[str] = None
    phone: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def clean_update_fields(cls, values):
        if not isinstance(values, dict):
            return values
        if "full_name" in values and not values.get("name"):
            values["name"] = values["full_name"]
        if "phone_number" in values and not values.get("phone"):
            values["phone"] = values["phone_number"]
        if values.get("phone"):
            clean_phone = re.sub(r"\D", "", str(values["phone"]))
            if len(clean_phone) == 10:
                values["phone"] = clean_phone
                values["phone_number"] = clean_phone
        return values


class PatientRegistrationPayload(BaseModel):
    # Demographics
    patient_id: Optional[str] = None
    barcode: Optional[str] = None
    registration_timestamp: Optional[datetime] = None

    full_name: Optional[str] = None
    name: Optional[str] = None

    dob: Optional[date] = None
    age: Optional[int] = None
    age_format: Optional[str] = "Years"
    age_years: Optional[int] = None
    age_months: Optional[int] = 0

    gender: str = "Male"
    guardian_name: Optional[str] = None
    guardian_relation: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    
    phone_number: Optional[str] = None
    phone: Optional[str] = None

    # Clinical Vitals & Visit
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    bmi: Optional[float] = None
    blood_pressure: Optional[str] = None
    temperature_f: Optional[float] = None
    spo2_percent: Optional[int] = None
    pulse_rate_bpm: Optional[int] = None
    grbs_mg_dl: Optional[int] = None
    consultant_assigned: Optional[str] = None
    remarks: Optional[str] = None

    # Legacy fields
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    pr: Optional[int] = None
    spo2: Optional[int] = None
    sugar: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_full_payload(cls, values):
        if not isinstance(values, dict):
            return values

        # Handle full_name / name
        name_val = values.get("full_name") or values.get("name")
        if not name_val:
            raise ValueError("Patient full name is required")
        values["name"] = name_val.strip()
        values["full_name"] = name_val.strip()

        # Handle phone / phone_number
        phone_val = values.get("phone_number") or values.get("phone")
        if not phone_val:
            raise ValueError("Phone number is required")
        clean_phone = re.sub(r"\D", "", str(phone_val))
        if len(clean_phone) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        values["phone"] = clean_phone
        values["phone_number"] = clean_phone

        # Handle age sync
        if values.get("age") is not None and values.get("age_years") is None:
            values["age_years"] = int(values["age"])
        elif values.get("age_years") is not None and values.get("age") is None:
            values["age"] = int(values["age_years"])

        # Handle gender normalization
        g = str(values.get("gender", "Male")).capitalize()
        if g in ["Male", "M"]:
            values["gender"] = "Male"
        elif g in ["Female", "F"]:
            values["gender"] = "Female"
        else:
            values["gender"] = "Others"

        return values


class PatientResponse(BaseModel):
    id: int
    patient_id: Optional[str] = None
    barcode: Optional[str] = None
    registration_timestamp: Optional[datetime] = None
    name: str
    full_name: Optional[str] = None
    dob: Optional[date] = None
    age: Optional[int] = None
    age_format: Optional[str] = "Years"
    age_years: Optional[int] = None
    age_months: Optional[int] = None
    gender: str
    guardian_name: Optional[str] = None
    guardian_relation: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    phone: str
    phone_number: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data):
        if isinstance(data, dict):
            if not data.get("full_name") and data.get("name"):
                data["full_name"] = data["name"]
            if not data.get("phone_number") and data.get("phone"):
                data["phone_number"] = data["phone"]
            return data
        return data

    class Config:
        from_attributes = True


