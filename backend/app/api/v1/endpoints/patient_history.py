from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.models.patient import Patient
from app.models.patient_history import (
    PatientAllergyHistory, PatientFamilyHistory, PatientSurgicalHistory, PatientPastHistory
)
from app.schemas.patient_history import PatientHistoryCreate, PatientHistoryResponse

router = APIRouter()


def get_history_model(history_type: str):
    """Get the appropriate history model."""
    models = {
        "allergy": PatientAllergyHistory,
        "family": PatientFamilyHistory,
        "surgical": PatientSurgicalHistory,
        "past": PatientPastHistory,
    }
    return models.get(history_type)


@router.get("/{patient_id}/{history_type}", response_model=List[PatientHistoryResponse])
async def get_patient_history(
    patient_id: int,
    history_type: str,  # allergy, family, surgical, past
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient history by type."""
    model = get_history_model(history_type)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid history type")
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    items = db.query(model).filter(
        model.patient_id == patient_id
    ).order_by(model.created_at.desc()).all()
    return [PatientHistoryResponse.model_validate(i) for i in items]


@router.post("/{patient_id}/{history_type}", response_model=PatientHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_patient_history(
    patient_id: int,
    history_type: str,
    data: PatientHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Create patient history entry."""
    model = get_history_model(history_type)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid history type")
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    item = model(patient_id=patient_id, value=data.value, is_active=data.is_active)
    db.add(item)
    db.commit()
    db.refresh(item)
    return PatientHistoryResponse.model_validate(item)


@router.patch("/{history_id}/{history_type}", response_model=PatientHistoryResponse)
async def update_patient_history(
    history_id: int,
    history_type: str,
    is_active: bool = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Toggle patient history active status (for checkbox UI)."""
    model = get_history_model(history_type)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid history type")
    item = db.query(model).filter(model.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    item.is_active = is_active
    db.commit()
    db.refresh(item)
    return PatientHistoryResponse.model_validate(item)
