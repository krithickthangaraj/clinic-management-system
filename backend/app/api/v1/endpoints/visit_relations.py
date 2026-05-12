from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.models.visit import Visit
from app.models.visit_relations import VisitComplaint, VisitDiagnosis, VisitPayment
from app.models.master import ChiefComplaintMaster, DiagnosisMaster
from sqlalchemy.orm import joinedload
from app.schemas.visit_relations import (
    VisitComplaintCreate, VisitComplaintResponse,
    VisitDiagnosisCreate, VisitDiagnosisResponse,
    VisitPaymentCreate, VisitPaymentUpdate, VisitPaymentResponse
)

router = APIRouter()


# Visit Complaints
@router.get("/{visit_id}/complaints", response_model=List[VisitComplaintResponse])
async def get_visit_complaints(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complaints for a visit."""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    items = db.query(VisitComplaint).options(joinedload(VisitComplaint.complaint)).filter(VisitComplaint.visit_id == visit_id).all()
    return [VisitComplaintResponse.model_validate(i) for i in items]


@router.post("/{visit_id}/complaints", response_model=VisitComplaintResponse, status_code=status.HTTP_201_CREATED)
async def add_visit_complaint(
    visit_id: int,
    data: VisitComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Add complaint to visit."""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Validate that either complaint_id or custom_complaint is provided
    if not data.complaint_id and not data.custom_complaint:
        raise HTTPException(status_code=400, detail="Either complaint_id or custom_complaint must be provided")
    
    item = VisitComplaint(visit_id=visit_id, complaint_id=data.complaint_id, custom_complaint=data.custom_complaint)
    db.add(item)
    db.commit()
    db.refresh(item)
    return VisitComplaintResponse.model_validate(item)


@router.delete("/{visit_id}/complaints/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_visit_complaint(
    visit_id: int,
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Remove complaint from visit."""
    item = db.query(VisitComplaint).filter(
        VisitComplaint.visit_id == visit_id,
        VisitComplaint.id == complaint_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Complaint not found")
    db.delete(item)
    db.commit()
    return None


# Visit Diagnosis
@router.get("/{visit_id}/diagnosis", response_model=List[VisitDiagnosisResponse])
async def get_visit_diagnosis(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get diagnosis for a visit."""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    items = db.query(VisitDiagnosis).options(joinedload(VisitDiagnosis.diagnosis)).filter(VisitDiagnosis.visit_id == visit_id).all()
    return [VisitDiagnosisResponse.model_validate(i) for i in items]


@router.post("/{visit_id}/diagnosis", response_model=VisitDiagnosisResponse, status_code=status.HTTP_201_CREATED)
async def add_visit_diagnosis(
    visit_id: int,
    data: VisitDiagnosisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Add diagnosis to visit."""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Validate that either diagnosis_id or custom_diagnosis is provided
    if not data.diagnosis_id and not data.custom_diagnosis:
        raise HTTPException(status_code=400, detail="Either diagnosis_id or custom_diagnosis must be provided")
    
    item = VisitDiagnosis(visit_id=visit_id, diagnosis_id=data.diagnosis_id, custom_diagnosis=data.custom_diagnosis)
    db.add(item)
    db.commit()
    db.refresh(item)
    return VisitDiagnosisResponse.model_validate(item)


@router.delete("/{visit_id}/diagnosis/{diagnosis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_visit_diagnosis(
    visit_id: int,
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Remove diagnosis from visit."""
    item = db.query(VisitDiagnosis).filter(
        VisitDiagnosis.visit_id == visit_id,
        VisitDiagnosis.id == diagnosis_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    db.delete(item)
    db.commit()
    return None


# Visit Payments
@router.get("/{visit_id}/payment", response_model=VisitPaymentResponse)
async def get_visit_payment(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payment for a visit."""
    payment = db.query(VisitPayment).filter(VisitPayment.visit_id == visit_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return VisitPaymentResponse.model_validate(payment)


@router.post("/{visit_id}/payment", response_model=VisitPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_visit_payment(
    visit_id: int,
    data: VisitPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Create payment for a visit."""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    existing = db.query(VisitPayment).filter(VisitPayment.visit_id == visit_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payment already exists, use PATCH to update")
    total = (data.doctor_fee or 0.0) + (data.lab_fee or 0.0)
    payment = VisitPayment(
        visit_id=visit_id,
        doctor_fee=data.doctor_fee or 0.0,
        lab_fee=data.lab_fee or 0.0,
        total=total,
        payment_status=data.payment_status or "pending",
        payment_mode=data.payment_mode
    )
    try:
        db.add(payment)
        db.commit()
        db.refresh(payment)
        return VisitPaymentResponse.model_validate(payment)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create payment: {str(e)}")


@router.patch("/{visit_id}/payment", response_model=VisitPaymentResponse)
async def update_visit_payment(
    visit_id: int,
    data: VisitPaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Update payment for a visit."""
    payment = db.query(VisitPayment).filter(VisitPayment.visit_id == visit_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    update_data = data.model_dump(exclude_unset=True)
    if "doctor_fee" in update_data or "lab_fee" in update_data:
        doctor_fee = update_data.get("doctor_fee", payment.doctor_fee)
        lab_fee = update_data.get("lab_fee", payment.lab_fee)
        update_data["total"] = doctor_fee + lab_fee
    for k, v in update_data.items():
        setattr(payment, k, v)
    db.commit()
    db.refresh(payment)
    return VisitPaymentResponse.model_validate(payment)
