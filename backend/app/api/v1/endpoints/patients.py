from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Union, Dict, Any
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.vitals import Vitals
from app.models.prescription import Prescription
from app.schemas.patient import (
    PatientCreate,
    PatientResponse,
    PatientUpdate,
    PatientRegistrationPayload,
)
from app.schemas.visit import VisitResponse
from app.schemas.vitals import VitalsResponse
from app.services.patient_service import register_patient_with_visit

router = APIRouter()


@router.get("/search", response_model=List[PatientResponse])
async def search_patients(
    q: str,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search patients by Patient ID (e.g. PAT-10001), Barcode scanner input, Name, or Phone number."""
    q = (q or "").strip()
    if not q:
        return []
    
    cond = or_(
        Patient.name.ilike(f"%{q}%"),
        Patient.phone.ilike(f"%{q}%"),
        Patient.patient_id.ilike(f"%{q}%"),
        Patient.barcode.ilike(f"%{q}%"),
    )
    if q.isdigit():
        cond = or_(cond, Patient.id == int(q))
    
    patients = (
        db.query(Patient)
        .filter(cond)
        .order_by(Patient.created_at.desc())
        .limit(limit)
        .all()
    )
    return [PatientResponse.model_validate(p) for p in patients]


@router.get("/{patient_id}/history")
async def get_patient_history(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get past visits with vitals and prescription for a patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    visits = (
        db.query(Visit)
        .filter(Visit.patient_id == patient_id)
        .order_by(Visit.created_at.desc())
        .all()
    )
    out = []
    for v in visits:
        vitals = db.query(Vitals).filter(Vitals.visit_id == v.id).first()
        pres = db.query(Prescription).filter(Prescription.visit_id == v.id).first()
        drugs = []
        if pres and pres.drugs:
            for d in pres.drugs:
                drugs.append({
                    "drug_name": getattr(d, "drug_name", None),
                    "dosage": getattr(d, "dosage", None),
                    "frequency": getattr(d, "frequency", None),
                })
        out.append({
            "visit": VisitResponse.model_validate(v),
            "vitals": VitalsResponse.model_validate(vitals) if vitals else None,
            "drugs": drugs,
        })
    return {"patient": PatientResponse.model_validate(patient), "history": out}


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_patient(
    payload: PatientRegistrationPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.RECEPTION, UserRole.ADMIN])),
):
    """
    Register a new patient, create visit, and record vitals atomically.
    Supports hospital spreadsheet fields with auto-calculation & validation.
    """
    # Extract patient demographics
    demographics_dict = {
        "patient_id": payload.patient_id,
        "barcode": payload.barcode,
        "registration_timestamp": payload.registration_timestamp,
        "full_name": payload.full_name or payload.name,
        "name": payload.name or payload.full_name,
        "dob": payload.dob,
        "age": payload.age,
        "age_format": payload.age_format or "Years",
        "age_years": payload.age_years,
        "age_months": payload.age_months or 0,
        "gender": payload.gender,
        "guardian_name": payload.guardian_name,
        "guardian_relation": payload.guardian_relation,
        "address": payload.address,
        "district": payload.district,
        "phone_number": payload.phone_number or payload.phone,
        "phone": payload.phone or payload.phone_number,
    }
    patient_create = PatientCreate(**demographics_dict)

    # Extract vitals data
    vitals_dict = {
        "weight_kg": payload.weight_kg if payload.weight_kg is not None else payload.weight,
        "height_cm": payload.height_cm,
        "bmi": payload.bmi,
        "blood_pressure": payload.blood_pressure,
        "temperature_f": payload.temperature_f,
        "temperature": payload.temperature,
        "spo2_percent": payload.spo2_percent if payload.spo2_percent is not None else payload.spo2,
        "pulse_rate_bpm": payload.pulse_rate_bpm if payload.pulse_rate_bpm is not None else payload.pr,
        "grbs_mg_dl": payload.grbs_mg_dl if payload.grbs_mg_dl is not None else payload.sugar,
        "consultant_assigned": payload.consultant_assigned,
        "remarks": payload.remarks,
        "bp_systolic": payload.bp_systolic,
        "bp_diastolic": payload.bp_diastolic,
    }

    patient, visit, vitals = register_patient_with_visit(
        db,
        patient_create,
        vitals_data=vitals_dict,
        consultant_assigned=payload.consultant_assigned,
    )

    return {
        "patient": PatientResponse.model_validate(patient),
        "visit": VisitResponse.model_validate(visit),
        "vitals": VitalsResponse.model_validate(vitals) if vitals else None,
    }


@router.get("", response_model=List[PatientResponse])
@router.get("/", response_model=List[PatientResponse])
async def list_patients(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all patients with optional search"""
    query = db.query(Patient)

    if search:
        query = query.filter(
            (Patient.name.ilike(f"%{search}%"))
            | (Patient.phone.ilike(f"%{search}%"))
            | (Patient.patient_id.ilike(f"%{search}%"))
            | (Patient.barcode.ilike(f"%{search}%"))
        )

    patients = (
        query.order_by(Patient.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [PatientResponse.model_validate(p) for p in patients]


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get patient by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )
    return PatientResponse.model_validate(patient)


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.RECEPTION, UserRole.ADMIN])),
):
    """Update patient details (reception edit mode)."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )
    for k, v in data.model_dump(exclude_unset=True).items():
        if hasattr(patient, k):
            setattr(patient, k, v)
    db.commit()
    db.refresh(patient)
    return PatientResponse.model_validate(patient)

