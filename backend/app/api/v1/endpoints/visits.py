import json
from datetime import datetime, date, time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.schemas.visit import (
    VisitCreate,
    VisitResponse,
    VisitUpdate,
    DoctorDashboardResponse,
)
from app.services.patient_service import generate_visit_number
from app.api.v1.endpoints.doctor import get_doctor_dashboard

router = APIRouter()


@router.get("/doctor-dashboard", response_model=DoctorDashboardResponse)
async def get_visits_doctor_dashboard(
    consultant: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN])),
):
    """Alias for /api/v1/doctor/dashboard"""
    return await get_doctor_dashboard(consultant=consultant, db=db, current_user=current_user)



@router.post("", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
async def create_visit(
    visit_data: VisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.RECEPTION, UserRole.ADMIN]))
):
    """Create a new visit (called automatically on patient registration)"""
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == visit_data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    visit_number = generate_visit_number(db)
    visit = Visit(
        visit_number=visit_number,
        patient_id=visit_data.patient_id,
        doctor_id=visit_data.doctor_id,
        status=VisitStatus.REGISTERED.value
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    
    return VisitResponse.model_validate(visit)


@router.get("", response_model=List[VisitResponse])
@router.get("/", response_model=List[VisitResponse])
async def list_visits(
    status_filter: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List visits with optional status filter"""
    query = db.query(Visit)
    
    if status_filter:
        query = query.filter(Visit.status == status_filter)
    
    visits = query.order_by(Visit.created_at.desc()).offset(skip).limit(limit).all()
    return [VisitResponse.model_validate(v) for v in visits]


@router.get("/reception-today", response_model=List[VisitResponse])
async def get_reception_today(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.RECEPTION, UserRole.ADMIN]))
):
    """Today's visits for reception with patient info (live list)."""
    from sqlalchemy.orm import joinedload

    start_today = datetime.combine(date.today(), time.min)
    visits = db.query(Visit).options(
        joinedload(Visit.patient)
    ).filter(
        Visit.created_at >= start_today
    ).order_by(Visit.created_at.desc()).all()

    result = []
    for v in visits:
        visit_dict = VisitResponse.model_validate(v).model_dump()
        if v.patient:
            visit_dict["patient_name"] = v.patient.name
            visit_dict["patient_phone"] = v.patient.phone
            visit_dict["patient_age"] = getattr(v.patient, "age_years", None) or getattr(v.patient, "age", None)
            visit_dict["patient_age_months"] = getattr(v.patient, "age_months", None)
            visit_dict["patient_gender"] = v.patient.gender
        result.append(VisitResponse(**visit_dict))
    return result


@router.get("/queue", response_model=List[VisitResponse])
async def get_doctor_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Get queue of patients waiting for doctor (vitals_done status)"""
    from sqlalchemy.orm import joinedload

    visits = db.query(Visit).options(
        joinedload(Visit.patient)
    ).filter(
        Visit.status.in_([
            VisitStatus.REGISTERED.value,
            VisitStatus.VITALS_DONE.value,
            VisitStatus.IN_CONSULTATION.value,
        ])
    ).order_by(Visit.created_at.asc()).all()

    result = []
    for v in visits:
        visit_dict = VisitResponse.model_validate(v).model_dump()
        if v.patient:
            visit_dict["patient_name"] = v.patient.name
            visit_dict["patient_age"] = getattr(v.patient, "age_years", None) or getattr(v.patient, "age", None)
            visit_dict["patient_age_months"] = getattr(v.patient, "age_months", None)
            visit_dict["patient_gender"] = v.patient.gender
        result.append(VisitResponse(**visit_dict))

    return result


@router.get("/doctor-today", response_model=List[VisitResponse])
async def get_doctor_today(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Today's visits for doctor with patient info (summary cards + filterable list)."""
    from sqlalchemy.orm import joinedload

    start_today = datetime.combine(date.today(), time.min)
    visits = db.query(Visit).options(
        joinedload(Visit.patient)
    ).filter(
        Visit.created_at >= start_today
    ).order_by(Visit.created_at.asc()).all()

    result = []
    for v in visits:
        visit_dict = VisitResponse.model_validate(v).model_dump()
        if v.patient:
            visit_dict["patient_name"] = v.patient.name
            visit_dict["patient_age"] = getattr(v.patient, "age_years", None) or getattr(v.patient, "age", None)
            visit_dict["patient_age_months"] = getattr(v.patient, "age_months", None)
            visit_dict["patient_gender"] = v.patient.gender
            visit_dict["patient_phone"] = v.patient.phone
        result.append(VisitResponse(**visit_dict))
    return result


@router.get("/{visit_id}", response_model=VisitResponse)
async def get_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get visit by ID"""
    from sqlalchemy.orm import joinedload
    
    visit = db.query(Visit).options(
        joinedload(Visit.patient)
    ).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    
    visit_dict = VisitResponse.model_validate(visit).model_dump()
    if visit.patient:
        visit_dict['patient_name'] = visit.patient.name
        visit_dict['patient_age'] = getattr(visit.patient, 'age_years', None) or getattr(visit.patient, 'age', None)
        visit_dict['patient_age_months'] = getattr(visit.patient, 'age_months', None)
        visit_dict['patient_gender'] = visit.patient.gender
        visit_dict['patient_phone'] = visit.patient.phone
    
    return VisitResponse(**visit_dict)


@router.patch("/{visit_id}", response_model=VisitResponse)
async def update_visit(
    visit_id: int,
    visit_update: VisitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Update visit (consultation data)"""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    
    # Update fields
    update_data = visit_update.model_dump(exclude_unset=True)
    
    # Convert chief_complaints list to JSON string
    if "chief_complaints" in update_data and update_data["chief_complaints"]:
        update_data["chief_complaints"] = json.dumps(update_data["chief_complaints"])
    
    for field, value in update_data.items():
        setattr(visit, field, value)
    
    # Auto-assign doctor if not set
    if not visit.doctor_id:
        visit.doctor_id = current_user.id
    
    db.commit()
    db.refresh(visit)
    
    return VisitResponse.model_validate(visit)
