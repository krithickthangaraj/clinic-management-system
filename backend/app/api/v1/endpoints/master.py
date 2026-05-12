from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.models.master import (
    ChiefComplaintMaster, DiagnosisMaster, DoctorAdviceMaster, LabTestMaster
)
from app.schemas.master import MasterItemCreate, MasterItemResponse

router = APIRouter()


# Chief Complaints Master
@router.get("/complaints", response_model=List[MasterItemResponse])
async def list_complaints(
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all complaints (for autocomplete)."""
    query = db.query(ChiefComplaintMaster).filter(ChiefComplaintMaster.is_active == True)
    if search:
        query = query.filter(ChiefComplaintMaster.name.ilike(f"%{search}%"))
    items = query.order_by(ChiefComplaintMaster.name).limit(100).all()
    return [MasterItemResponse.model_validate(i) for i in items]


@router.post("/complaints", response_model=MasterItemResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    data: MasterItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Create a new complaint in master."""
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Complaint name is required")
    
    try:
        existing = db.query(ChiefComplaintMaster).filter(ChiefComplaintMaster.name.ilike(data.name.strip())).first()
        if existing:
            return MasterItemResponse.model_validate(existing)
        item = ChiefComplaintMaster(name=data.name.strip())
        db.add(item)
        db.commit()
        db.refresh(item)
        return MasterItemResponse.model_validate(item)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create complaint: {str(e)}")


# Diagnosis Master
@router.get("/diagnosis", response_model=List[MasterItemResponse])
async def list_diagnosis(
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all diagnosis (for autocomplete)."""
    query = db.query(DiagnosisMaster).filter(DiagnosisMaster.is_active == True)
    if search:
        query = query.filter(DiagnosisMaster.name.ilike(f"%{search}%"))
    items = query.order_by(DiagnosisMaster.name).limit(100).all()
    return [MasterItemResponse.model_validate(i) for i in items]


@router.post("/diagnosis", response_model=MasterItemResponse, status_code=status.HTTP_201_CREATED)
async def create_diagnosis(
    data: MasterItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Create a new diagnosis in master."""
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Diagnosis name is required")
    
    try:
        existing = db.query(DiagnosisMaster).filter(DiagnosisMaster.name.ilike(data.name.strip())).first()
        if existing:
            return MasterItemResponse.model_validate(existing)
        item = DiagnosisMaster(name=data.name.strip())
        db.add(item)
        db.commit()
        db.refresh(item)
        return MasterItemResponse.model_validate(item)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create diagnosis: {str(e)}")


# Doctor Advice Master
@router.get("/advice", response_model=List[MasterItemResponse])
async def list_advice(
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all advice (for autocomplete)."""
    query = db.query(DoctorAdviceMaster).filter(DoctorAdviceMaster.is_active == True)
    if search:
        query = query.filter(DoctorAdviceMaster.name.ilike(f"%{search}%"))
    items = query.order_by(DoctorAdviceMaster.name).limit(100).all()
    return [MasterItemResponse.model_validate(i) for i in items]


@router.post("/advice", response_model=MasterItemResponse, status_code=status.HTTP_201_CREATED)
async def create_advice(
    data: MasterItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Create a new advice in master."""
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Advice name is required")
    
    try:
        existing = db.query(DoctorAdviceMaster).filter(DoctorAdviceMaster.name.ilike(data.name.strip())).first()
        if existing:
            return MasterItemResponse.model_validate(existing)
        item = DoctorAdviceMaster(name=data.name.strip())
        db.add(item)
        db.commit()
        db.refresh(item)
        return MasterItemResponse.model_validate(item)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create advice: {str(e)}")


# Lab Tests Master
@router.get("/lab-tests", response_model=List[MasterItemResponse])
async def list_lab_tests(
    search: str = None,
    test_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all lab tests (for autocomplete)."""
    query = db.query(LabTestMaster).filter(LabTestMaster.is_active == True)
    if test_type:
        query = query.filter(LabTestMaster.test_type == test_type)
    if search:
        query = query.filter(LabTestMaster.name.ilike(f"%{search}%"))
    items = query.order_by(LabTestMaster.name).limit(100).all()
    return [MasterItemResponse.model_validate(i) for i in items]


@router.post("/lab-tests", response_model=MasterItemResponse, status_code=status.HTTP_201_CREATED)
async def create_lab_test(
    data: MasterItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Create a new lab test in master."""
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Test name is required")
    if not data.test_type:
        raise HTTPException(status_code=400, detail="test_type is required (Lab or Radiology)")
    
    try:
        existing = db.query(LabTestMaster).filter(
            LabTestMaster.name.ilike(data.name.strip()),
            LabTestMaster.test_type == data.test_type
        ).first()
        if existing:
            return MasterItemResponse.model_validate(existing)
        item = LabTestMaster(name=data.name.strip(), test_type=data.test_type)
        db.add(item)
        db.commit()
        db.refresh(item)
        return MasterItemResponse.model_validate(item)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create lab test: {str(e)}")
