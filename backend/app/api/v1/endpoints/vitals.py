from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.visit import Visit
from app.models.vitals import Vitals
from app.schemas.vitals import VitalsCreate, VitalsResponse, VitalsUpdate

router = APIRouter()


@router.post("", response_model=VitalsResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=VitalsResponse, status_code=status.HTTP_201_CREATED)
async def create_vitals(
    vitals_data: VitalsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.RECEPTION, UserRole.ADMIN]))
):
    """Enter vitals for a visit"""
    # Verify visit exists
    visit = db.query(Visit).filter(Visit.id == vitals_data.visit_id).first()
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    
    # Check if vitals already exist
    existing = db.query(Vitals).filter(Vitals.visit_id == vitals_data.visit_id).first()
    if existing:
        # Update existing vitals
        for field, value in vitals_data.model_dump(exclude_unset=True).items():
            if field != "visit_id":
                setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        # Update visit status
        visit.status = VisitStatus.VITALS_DONE.value
        db.commit()
        return VitalsResponse.model_validate(existing)
    
    # Create new vitals
    vitals = Vitals(**vitals_data.model_dump())
    db.add(vitals)
    
    # Update visit status
    visit.status = VisitStatus.VITALS_DONE.value
    
    db.commit()
    db.refresh(vitals)
    
    return VitalsResponse.model_validate(vitals)


@router.get("/visit/{visit_id}", response_model=VitalsResponse)
async def get_vitals_by_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get vitals for a specific visit"""
    vitals = db.query(Vitals).filter(Vitals.visit_id == visit_id).first()
    if not vitals:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vitals not found for this visit"
        )
    return VitalsResponse.model_validate(vitals)


@router.patch("/visit/{visit_id}", response_model=VitalsResponse)
async def update_vitals_by_visit(
    visit_id: int,
    data: VitalsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Update vitals for a visit (doctor edit from consultation)."""
    vitals = db.query(Vitals).filter(Vitals.visit_id == visit_id).first()
    if not vitals:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vitals not found for this visit")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(vitals, k, v)
    db.commit()
    db.refresh(vitals)
    return VitalsResponse.model_validate(vitals)
