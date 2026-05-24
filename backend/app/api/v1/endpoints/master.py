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
from app.schemas.master import MasterItemCreate, MasterItemUpdate, MasterItemResponse

router = APIRouter()


def update_master_item(db: Session, model, item_id: int, data: MasterItemUpdate):
    item = db.query(model).filter(model.id == item_id, model.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    item.name = data.name.strip()
    if hasattr(item, "test_type") and data.test_type:
        item.test_type = data.test_type
    db.commit()
    db.refresh(item)
    return MasterItemResponse.model_validate(item)


def deactivate_master_item(db: Session, model, item_id: int):
    item = db.query(model).filter(model.id == item_id, model.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.is_active = False
    db.commit()


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


@router.patch("/complaints/{item_id}", response_model=MasterItemResponse)
async def update_complaint(
    item_id: int,
    data: MasterItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Update a complaint in master."""
    try:
        return update_master_item(db, ChiefComplaintMaster, item_id, data)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update complaint: {str(e)}")


@router.delete("/complaints/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_complaint(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Soft-delete a complaint from master."""
    deactivate_master_item(db, ChiefComplaintMaster, item_id)


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


@router.patch("/diagnosis/{item_id}", response_model=MasterItemResponse)
async def update_diagnosis(
    item_id: int,
    data: MasterItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Update a diagnosis in master."""
    try:
        return update_master_item(db, DiagnosisMaster, item_id, data)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update diagnosis: {str(e)}")


@router.delete("/diagnosis/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diagnosis(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Soft-delete a diagnosis from master."""
    deactivate_master_item(db, DiagnosisMaster, item_id)


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


@router.patch("/advice/{item_id}", response_model=MasterItemResponse)
async def update_advice(
    item_id: int,
    data: MasterItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Update an advice item in master."""
    try:
        return update_master_item(db, DoctorAdviceMaster, item_id, data)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update advice: {str(e)}")


@router.delete("/advice/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_advice(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Soft-delete an advice item from master."""
    deactivate_master_item(db, DoctorAdviceMaster, item_id)


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


@router.patch("/lab-tests/{item_id}", response_model=MasterItemResponse)
async def update_lab_test(
    item_id: int,
    data: MasterItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Update a lab test in master."""
    try:
        return update_master_item(db, LabTestMaster, item_id, data)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update lab test: {str(e)}")


@router.delete("/lab-tests/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab_test(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Soft-delete a lab test from master."""
    deactivate_master_item(db, LabTestMaster, item_id)
