from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.enums import VisitStatus
from app.schemas.patient import PatientCreate
from datetime import datetime


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
    patient_data: PatientCreate
) -> tuple[Patient, Visit]:
    """
    Register a new patient and automatically create a visit.
    This is the main workflow for reception staff.
    """
    # Check if patient exists
    existing_patient = db.query(Patient).filter(
        Patient.phone == patient_data.phone
    ).first()
    
    if existing_patient:
        patient = existing_patient
    else:
        data = patient_data.model_dump()
        data['age'] = data.get('age_years', 0)  # legacy field
        patient = Patient(**data)
        db.add(patient)
        db.flush()
    
    # Create visit automatically
    visit_number = generate_visit_number(db)
    visit = Visit(
        visit_number=visit_number,
        patient_id=patient.id,
        status=VisitStatus.REGISTERED.value
    )
    db.add(visit)
    db.commit()
    db.refresh(patient)
    db.refresh(visit)
    
    return patient, visit
