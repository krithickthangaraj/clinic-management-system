from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.models.master import (
    ChiefComplaintMaster, DiagnosisMaster, DoctorAdviceMaster, LabTestMaster
)
from app.models.medicine import (
    MedicineDrug, MedicineType, MedicineBrand, MedicineDosage, MedicineMaster
)
from app.schemas.medicine import (
    MedicineDrugCreate, MedicineTypeCreate, MedicineBrandCreate, MedicineDosageCreate, MedicineItemResponse,
    MedicineMasterCreate, MedicineMasterUpdate, MedicineMasterResponse
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


# Medicine Master: Drugs
@router.get("/meds/drugs", response_model=List[MedicineItemResponse])
async def list_medicine_drugs(
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MedicineDrug).filter(MedicineDrug.is_active == True)
    if search:
        query = query.filter(MedicineDrug.name.ilike(f"%{search}%"))
    items = query.order_by(MedicineDrug.name).limit(200).all()
    return [MedicineItemResponse.model_validate(i) for i in items]


@router.post("/meds/drugs", response_model=MedicineItemResponse, status_code=status.HTTP_201_CREATED)
async def create_medicine_drug(
    data: MedicineDrugCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Drug name is required")
    try:
        existing = db.query(MedicineDrug).filter(MedicineDrug.name.ilike(data.name.strip())).first()
        if existing:
            return MedicineItemResponse.model_validate(existing)
        item = MedicineDrug(name=data.name.strip())
        db.add(item)
        db.commit()
        db.refresh(item)
        return MedicineItemResponse.model_validate(item)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create drug: {str(e)}")


# Medicine Types
@router.get("/meds/types", response_model=List[MedicineItemResponse])
async def list_medicine_types(
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MedicineType).filter(MedicineType.is_active == True)
    if search:
        query = query.filter(MedicineType.name.ilike(f"%{search}%"))
    items = query.order_by(MedicineType.name).limit(100).all()
    return [MedicineItemResponse.model_validate(i) for i in items]


@router.post("/meds/types", response_model=MedicineItemResponse, status_code=status.HTTP_201_CREATED)
async def create_medicine_type(
    data: MedicineTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Type name is required")
    existing = db.query(MedicineType).filter(MedicineType.name.ilike(data.name.strip())).first()
    if existing:
        return MedicineItemResponse.model_validate(existing)
    item = MedicineType(name=data.name.strip())
    db.add(item)
    db.commit()
    db.refresh(item)
    return MedicineItemResponse.model_validate(item)


# Brands (filtered by drug and/or type)
@router.get("/meds/brands", response_model=List[MedicineItemResponse])
async def list_medicine_brands(
    drug_id: int = None,
    type_id: int = None,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MedicineBrand).filter(MedicineBrand.is_active == True)
    if drug_id:
        query = query.filter(MedicineBrand.drug_id == drug_id)
    if type_id:
        query = query.filter(MedicineBrand.type_id == type_id)
    if search:
        query = query.filter(MedicineBrand.name.ilike(f"%{search}%"))
    items = query.order_by(MedicineBrand.name).limit(200).all()
    return [MedicineItemResponse.model_validate(i) for i in items]


@router.post("/meds/brands", response_model=MedicineItemResponse, status_code=status.HTTP_201_CREATED)
async def create_medicine_brand(
    data: MedicineBrandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Brand name is required")
    # Prevent duplicate brand for same drug/type
    existing = db.query(MedicineBrand).filter(
        MedicineBrand.drug_id == data.drug_id,
        MedicineBrand.type_id == data.type_id,
        MedicineBrand.name.ilike(data.name.strip()),
        MedicineBrand.is_active == True,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Brand already exists for this drug/type")
    item = MedicineBrand(name=data.name.strip(), drug_id=data.drug_id, type_id=data.type_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return MedicineItemResponse.model_validate(item)


# Dosages (filtered by brand)
@router.get("/meds/dosages", response_model=List[MedicineItemResponse])
async def list_medicine_dosages(
    brand_id: int = None,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MedicineDosage).filter(MedicineDosage.is_active == True)
    if brand_id:
        query = query.filter(MedicineDosage.brand_id == brand_id)
    if search:
        query = query.filter(MedicineDosage.label.ilike(f"%{search}%"))
    items = query.order_by(MedicineDosage.label).limit(200).all()
    return [MedicineItemResponse.model_validate(i) for i in items]


@router.post("/meds/dosages", response_model=MedicineItemResponse, status_code=status.HTTP_201_CREATED)
async def create_medicine_dosage(
    data: MedicineDosageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    if not data.label or not data.label.strip():
        raise HTTPException(status_code=400, detail="Dosage label is required")
    # Prevent duplicate dosage label for the same brand
    existing = db.query(MedicineDosage).filter(
        MedicineDosage.brand_id == data.brand_id,
        MedicineDosage.label.ilike(data.label.strip()),
        MedicineDosage.is_active == True,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Dosage already exists for this brand")
    item = MedicineDosage(brand_id=data.brand_id, label=data.label.strip(), default_instruction=data.default_instruction)
    db.add(item)
    db.commit()
    db.refresh(item)
    return MedicineItemResponse.model_validate(item)


# Update / disable endpoints for medicine master
@router.patch("/meds/drugs/{item_id}", response_model=MedicineItemResponse)
async def update_medicine_drug(item_id: int, data: MedicineDrugCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))):
    item = db.query(MedicineDrug).filter(MedicineDrug.id == item_id, MedicineDrug.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Drug not found")
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    item.name = data.name.strip()
    db.commit()
    db.refresh(item)
    return MedicineItemResponse.model_validate(item)


@router.delete("/meds/drugs/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medicine_drug(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))):
    item = db.query(MedicineDrug).filter(MedicineDrug.id == item_id, MedicineDrug.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Drug not found")
    item.is_active = False
    db.commit()


@router.patch("/meds/types/{item_id}", response_model=MedicineItemResponse)
async def update_medicine_type(item_id: int, data: MedicineTypeCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))):
    item = db.query(MedicineType).filter(MedicineType.id == item_id, MedicineType.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Type not found")
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    item.name = data.name.strip()
    db.commit()
    db.refresh(item)
    return MedicineItemResponse.model_validate(item)


@router.delete("/meds/types/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medicine_type(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))):
    item = db.query(MedicineType).filter(MedicineType.id == item_id, MedicineType.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Type not found")
    item.is_active = False
    db.commit()


@router.patch("/meds/brands/{item_id}", response_model=MedicineItemResponse)
async def update_medicine_brand(item_id: int, data: MedicineBrandCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))):
    item = db.query(MedicineBrand).filter(MedicineBrand.id == item_id, MedicineBrand.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Brand not found")
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    # Check duplicate against other active brands
    dup = db.query(MedicineBrand).filter(
        MedicineBrand.id != item_id,
        MedicineBrand.drug_id == data.drug_id,
        MedicineBrand.type_id == data.type_id,
        MedicineBrand.name.ilike(data.name.strip()),
        MedicineBrand.is_active == True,
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="Another brand with the same name exists for this drug/type")
    item.name = data.name.strip()
    item.drug_id = data.drug_id
    item.type_id = data.type_id
    db.commit()
    db.refresh(item)
    return MedicineItemResponse.model_validate(item)


@router.delete("/meds/brands/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medicine_brand(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))):
    item = db.query(MedicineBrand).filter(MedicineBrand.id == item_id, MedicineBrand.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Brand not found")
    item.is_active = False
    db.commit()


@router.patch("/meds/dosages/{item_id}", response_model=MedicineItemResponse)
async def update_medicine_dosage(item_id: int, data: MedicineDosageCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))):
    item = db.query(MedicineDosage).filter(MedicineDosage.id == item_id, MedicineDosage.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Dosage not found")
    if not data.label or not data.label.strip():
        raise HTTPException(status_code=400, detail="Label is required")
    # Check duplicate label for same brand excluding self
    dup = db.query(MedicineDosage).filter(
        MedicineDosage.id != item_id,
        MedicineDosage.brand_id == data.brand_id,
        MedicineDosage.label.ilike(data.label.strip()),
        MedicineDosage.is_active == True,
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="Another dosage with same label exists for this brand")
    item.label = data.label.strip()
    item.brand_id = data.brand_id
    item.default_instruction = data.default_instruction
    db.commit()
    db.refresh(item)
    return MedicineItemResponse.model_validate(item)


@router.delete("/meds/dosages/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medicine_dosage(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))):
    item = db.query(MedicineDosage).filter(MedicineDosage.id == item_id, MedicineDosage.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Dosage not found")
    item.is_active = False
    db.commit()


# =============================================================================
# Medicine Master Prescription Templates (Magic Auto-Fill & Admin Management)
# =============================================================================

@router.get("/medicines", response_model=List[MedicineMasterResponse])
async def list_medicine_master(
    search: Optional[str] = None,
    category: Optional[str] = None,
    include_inactive: bool = False,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search & list Medicine Master prescription templates.
    Supports filtering by search query (brand/drug), category, and active status.
    """
    query = db.query(MedicineMaster)
    if not include_inactive:
        query = query.filter(MedicineMaster.is_active == True)

    if category and category.strip() and category != "all":
        query = query.filter(MedicineMaster.category.ilike(category.strip()))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (MedicineMaster.brand_name.ilike(term)) | (MedicineMaster.drug_name.ilike(term))
        )

    items = query.order_by(MedicineMaster.brand_name.asc()).offset(skip).limit(limit).all()
    return items


@router.post("/medicines", response_model=MedicineMasterResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_medicine_master(
    data: MedicineMasterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN, UserRole.PHARMACY])),
):
    """
    Create a new MedicineMaster template or update defaults if active brand_name exists.
    """
    brand = (data.brand_name or "").strip()
    drug = (data.drug_name or "").strip()
    if not brand or not drug:
        raise HTTPException(status_code=400, detail="Brand name and generic drug name are required")

    existing = db.query(MedicineMaster).filter(
        MedicineMaster.brand_name.ilike(brand),
        MedicineMaster.is_active == True,
    ).first()

    if existing:
        existing.drug_name = drug
        existing.category = data.category or existing.category
        existing.default_dosage = data.default_dosage or existing.default_dosage
        existing.default_frequency = data.default_frequency or existing.default_frequency
        existing.default_days = data.default_days or existing.default_days
        existing.default_instructions = data.default_instructions if data.default_instructions is not None else existing.default_instructions
        existing.updated_at = func.now()
        db.commit()
        db.refresh(existing)
        return existing

    item = MedicineMaster(
        brand_name=brand,
        drug_name=drug,
        category=data.category or "Tablet",
        default_dosage=data.default_dosage or "1 Tab",
        default_frequency=data.default_frequency or "TDS (1-1-1)",
        default_days=data.default_days or 3,
        default_instructions=data.default_instructions or "",
        is_active=True,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/medicines/{item_id}", response_model=MedicineMasterResponse)
async def get_medicine_master_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch single master medicine by ID"""
    item = db.query(MedicineMaster).filter(MedicineMaster.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Medicine template not found")
    return item


@router.put("/medicines/{item_id}", response_model=MedicineMasterResponse)
@router.patch("/medicines/{item_id}", response_model=MedicineMasterResponse)
async def update_medicine_master_item(
    item_id: int,
    data: MedicineMasterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN, UserRole.PHARMACY])),
):
    """
    Update an existing master template (brand name, drug name, dosage, frequency, days, instructions).
    """
    item = db.query(MedicineMaster).filter(MedicineMaster.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Medicine template not found")

    update_dict = data.model_dump(exclude_unset=True)
    if "brand_name" in update_dict and update_dict["brand_name"]:
        brand_clean = update_dict["brand_name"].strip()
        # Check duplicate
        dup = db.query(MedicineMaster).filter(
            MedicineMaster.id != item_id,
            MedicineMaster.brand_name.ilike(brand_clean),
            MedicineMaster.is_active == True,
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Another active medicine with this brand name already exists")
        item.brand_name = brand_clean

    if "drug_name" in update_dict and update_dict["drug_name"]:
        item.drug_name = update_dict["drug_name"].strip()

    if "category" in update_dict and update_dict["category"] is not None:
        item.category = update_dict["category"]

    if "default_dosage" in update_dict and update_dict["default_dosage"] is not None:
        item.default_dosage = update_dict["default_dosage"]

    if "default_frequency" in update_dict and update_dict["default_frequency"] is not None:
        item.default_frequency = update_dict["default_frequency"]

    if "default_days" in update_dict and update_dict["default_days"] is not None:
        item.default_days = update_dict["default_days"]

    if "default_instructions" in update_dict and update_dict["default_instructions"] is not None:
        item.default_instructions = update_dict["default_instructions"]

    item.updated_at = func.now()
    db.commit()
    db.refresh(item)
    return item


@router.delete("/medicines/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medicine_master_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN, UserRole.PHARMACY])),
):
    """
    Soft-delete a medicine template (sets is_active = False).
    Preserves historical patient prescription references while removing it from active search.
    """
    item = db.query(MedicineMaster).filter(MedicineMaster.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Medicine template not found")

    item.is_active = False
    item.updated_at = func.now()
    db.commit()



