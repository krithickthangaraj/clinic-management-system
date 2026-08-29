from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.vitals import Vitals
from app.models.enums import VisitStatus
from app.schemas.patient import PatientCreate
from app.schemas.vitals import VitalsCreate
from datetime import datetime
from typing import Optional, Tuple
import re


def generate_patient_id(db: Session) -> str:
    """Generate sequential patient ID: PAT-10001, PAT-10002, etc."""
    # Find patient with highest sequence number
    last_patient = (
        db.query(Patient)
        .filter(Patient.patient_id.like("PAT-%"))
        .order_by(desc(Patient.id))
        .first()
    )
    if last_patient and last_patient.patient_id:
        match = re.search(r"PAT-(\d+)", last_patient.patient_id)
        if match:
            seq = int(match.group(1)) + 1
            return f"PAT-{seq:05d}"
    
    # Fallback based on total count
    count = db.query(Patient).count()
    return f"PAT-{10001 + count:05d}"


def generate_visit_number(db: Session) -> str:
    """Generate unique visit number: V-YYYYMMDD-XXX"""
    today = datetime.now().strftime("%Y%m%d")
    last_visit = db.query(Visit).filter(
        Visit.visit_number.like(f"V-{today}-%")
    ).order_by(Visit.id.desc()).first()
    
    if last_visit:
        seq = int(last_visit.visit_number.split("-")[-1])
        seq += 1
    else:
        seq = 1
    
    return f"V-{today}-{seq:03d}"


def register_patient_with_visit(
    db: Session,
    patient_data: PatientCreate,
    vitals_data: Optional[dict] = None,
    consultant_assigned: Optional[str] = None
) -> Tuple[Patient, Visit, Optional[Vitals]]:
    """
    Register a new patient, create visit, and optionally record initial vitals.
    """
    # Match existing patient by BOTH Phone AND Normalized Name to support shared family phones
    clean_phone = (patient_data.phone or "").strip()
    clean_name = (patient_data.name or "").strip().lower()

    existing_patient = None
    if clean_phone and clean_name:
        existing_patient = db.query(Patient).filter(
            Patient.phone == clean_phone,
            func.lower(Patient.name) == clean_name
        ).first()
    
    if existing_patient:
        patient = existing_patient
        # Update details if provided
        for k, v in patient_data.model_dump(exclude_unset=True).items():
            if v is not None and hasattr(patient, k) and k not in ("patient_id", "id"):
                setattr(patient, k, v)
        if not patient.patient_id:
            patient.patient_id = generate_patient_id(db)
        if not patient.barcode:
            patient.barcode = patient.patient_id
    else:
        # Create NEW distinct family member / patient record with unique UHID
        data = patient_data.model_dump()
        data["patient_id"] = generate_patient_id(db)
        data["barcode"] = data["patient_id"]
        data["age"] = data.get("age_years", 0)  # legacy compatibility
        patient = Patient(**data)
        db.add(patient)
        db.flush()
    
    # Create visit automatically
    visit_number = generate_visit_number(db)
    consultant = consultant_assigned or (vitals_data.get("consultant_assigned") if vitals_data else None)
    
    visit = Visit(
        visit_number=visit_number,
        patient_id=patient.id,
        consultant_assigned=consultant,
        status=VisitStatus.REGISTERED.value
    )
    db.add(visit)
    db.flush()
    
    # Check and create vitals if provided
    created_vitals = None
    if vitals_data:
        # Filter out empty or None values
        valid_vitals = {k: v for k, v in vitals_data.items() if v is not None and v != ""}
        if valid_vitals:
            valid_vitals["visit_id"] = visit.id
            if consultant and not valid_vitals.get("consultant_assigned"):
                valid_vitals["consultant_assigned"] = consultant
            
            # Use VitalsCreate schema for calculation/validation reconciliation
            v_create = VitalsCreate(**valid_vitals)
            created_vitals = Vitals(**v_create.model_dump(exclude_unset=True))
            db.add(created_vitals)
            visit.status = VisitStatus.VITALS_DONE.value

    db.commit()
    db.refresh(patient)
    db.refresh(visit)
    if created_vitals:
        db.refresh(created_vitals)
    
    return patient, visit, created_vitals

