from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.visit import Visit
from app.models.prescription import Prescription, PrescriptionDrug
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse

router = APIRouter()


@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Create prescription for a visit"""
    # Verify visit exists
    visit = db.query(Visit).filter(Visit.id == prescription_data.visit_id).first()
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    
    # Check if prescription already exists
    existing = db.query(Prescription).filter(Prescription.visit_id == prescription_data.visit_id).first()
    if existing:
        # Delete existing drugs and prescription
        db.query(PrescriptionDrug).filter(PrescriptionDrug.prescription_id == existing.id).delete()
        db.delete(existing)
        db.commit()
    
    # Create prescription
    prescription = Prescription(
        visit_id=prescription_data.visit_id,
        doctor_id=current_user.id
    )
    db.add(prescription)
    db.flush()  # Get prescription ID
    
    # Add drugs
    for drug_data in prescription_data.drugs:
        drug = PrescriptionDrug(
            prescription_id=prescription.id,
            **drug_data.dict()
        )
        db.add(drug)
    
    # Update visit status
    visit.status = VisitStatus.CONSULTED.value
    visit.doctor_id = current_user.id
    
    db.commit()
    db.refresh(prescription)
    
    return PrescriptionResponse.model_validate(prescription)


@router.get("/visit/{visit_id}", response_model=PrescriptionResponse)
async def get_prescription_by_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get prescription for a specific visit"""
    prescription = db.query(Prescription).filter(Prescription.visit_id == visit_id).first()
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found for this visit"
        )
    return PrescriptionResponse.model_validate(prescription)


@router.post("/{prescription_id}/print")
async def mark_prescription_printed(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Mark prescription as printed"""
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    from datetime import datetime
    prescription.printed_at = datetime.utcnow()
    
    # Update visit status to completed
    visit = db.query(Visit).filter(Visit.id == prescription.visit_id).first()
    if visit:
        visit.status = VisitStatus.COMPLETED.value
    
    db.commit()
    
    return {"message": "Prescription marked as printed"}
