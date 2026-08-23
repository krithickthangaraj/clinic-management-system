from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.models.enums import UserRole
from app.models.settings import HospitalSettings
from app.models.master import (
    ChiefComplaintMaster, DiagnosisMaster, DoctorAdviceMaster, ProcedureMaster, ReferralMaster, LabTestMaster
)
from app.schemas.settings import (
    HospitalSettingsResponse, HospitalSettingsUpdate,
    StaffCreate, StaffUpdate, StaffPasswordReset, StaffResponse,
    ProfileUpdate, ChangePasswordRequest,
    DictionaryTermCreate, DictionaryTermUpdate, DictionaryTermResponse
)

router = APIRouter()


# ============================================================================
# 1. HOSPITAL DETAILS & LETTERHEAD SETTINGS
# ============================================================================

@router.get("/hospital", response_model=HospitalSettingsResponse)
async def get_hospital_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve global hospital configuration and branding for headers and prints."""
    settings = db.query(HospitalSettings).first()
    if not settings:
        settings = HospitalSettings(
            hospital_name="AEREN CLINIC & HEALTHCARE",
            tagline="Excellence in Outpatient Healthcare & Diagnostics",
            address="123 Medical Center Road, Central Healthcare District",
            phone="+91 98765 43210",
            email="contact@aerenclinic.com",
            website="www.aerenclinic.com",
            registration_number="REG-TN-2024-8849",
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("/hospital", response_model=HospitalSettingsResponse)
async def update_hospital_settings(
    data: HospitalSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR]))
):
    """Update global hospital settings (Admin/Lead Doctor only)."""
    settings = db.query(HospitalSettings).first()
    if not settings:
        settings = HospitalSettings()
        db.add(settings)

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, val)

    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    return settings


# ============================================================================
# 2. STAFF MANAGEMENT
# ============================================================================

@router.get("/staff", response_model=List[StaffResponse])
async def list_staff(
    role: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """List staff directory with optional role/name search (Admin only)."""
    query = db.query(User)
    if role and role != "all":
        query = query.filter(User.role == role)
    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) |
            (User.username.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    return query.order_by(User.id.asc()).all()


@router.post("/staff", response_model=StaffResponse)
async def create_staff(
    data: StaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Add a new staff member."""
    existing = db.query(User).filter(User.username == data.username.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    if data.email:
        existing_email = db.query(User).filter(User.email == data.email.strip()).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        username=data.username.strip(),
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name.strip(),
        role=data.role,
        email=data.email.strip() if data.email else None,
        phone=data.phone.strip() if data.phone else None,
        department=data.department.strip() if data.department else None,
        qualification=data.qualification.strip() if data.qualification else None,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/staff/{user_id}", response_model=StaffResponse)
async def update_staff(
    user_id: int,
    data: StaffUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Edit staff member information."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(user, field, val)

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


@router.patch("/staff/{user_id}/status", response_model=StaffResponse)
async def toggle_staff_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Toggle staff account status between active and deactivated."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own active account")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.post("/staff/{user_id}/reset-password")
async def admin_reset_password(
    user_id: int,
    data: StaffPasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Admin password reset for a staff user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")
    
    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long")

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": f"Password reset successfully for {user.username}"}


# ============================================================================
# 3. CLINICAL DICTIONARY (MASTER VALUES)
# ============================================================================

CATEGORY_MODEL_MAP = {
    "complaints": ChiefComplaintMaster,
    "diagnosis": DiagnosisMaster,
    "advice": DoctorAdviceMaster,
    "procedures": ProcedureMaster,
    "referrals": ReferralMaster,
    "lab_tests": LabTestMaster,
}


@router.get("/dictionary/{category}", response_model=List[DictionaryTermResponse])
async def list_dictionary_terms(
    category: str,
    search: Optional[str] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List clinical terms for a given category (Complaints, Diagnosis, Advice, Procedures, Referrals)."""
    model = CATEGORY_MODEL_MAP.get(category.lower())
    if not model:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category '{category}'. Available: {list(CATEGORY_MODEL_MAP.keys())}"
        )

    query = db.query(model)
    if not include_inactive:
        query = query.filter(model.is_active == True)
    if search:
        query = query.filter(model.name.ilike(f"%{search}%"))

    items = query.order_by(model.name.asc()).all()
    return [DictionaryTermResponse.model_validate(i) for i in items]


@router.post("/dictionary/{category}", response_model=DictionaryTermResponse)
async def add_dictionary_term(
    category: str,
    data: DictionaryTermCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR]))
):
    """Add a new clinical term to the global dictionary."""
    model = CATEGORY_MODEL_MAP.get(category.lower())
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid category '{category}'")

    term_name = data.name.strip()
    if not term_name:
        raise HTTPException(status_code=400, detail="Term name cannot be empty")

    existing = db.query(model).filter(model.name.ilike(term_name)).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            db.refresh(existing)
            return DictionaryTermResponse.model_validate(existing)
        raise HTTPException(status_code=400, detail=f"Term '{term_name}' already exists in {category}")

    item_dict = {"name": term_name, "is_active": True}
    if hasattr(model, "specialty") and data.specialty:
        item_dict["specialty"] = data.specialty.strip()
    if hasattr(model, "test_type") and data.test_type:
        item_dict["test_type"] = data.test_type.strip()

    new_item = model(**item_dict)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return DictionaryTermResponse.model_validate(new_item)


@router.put("/dictionary/{category}/{item_id}", response_model=DictionaryTermResponse)
async def update_dictionary_term(
    category: str,
    item_id: int,
    data: DictionaryTermUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR]))
):
    """Update an existing clinical dictionary term."""
    model = CATEGORY_MODEL_MAP.get(category.lower())
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid category '{category}'")

    item = db.query(model).filter(model.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Dictionary item not found")

    term_name = data.name.strip()
    if not term_name:
        raise HTTPException(status_code=400, detail="Term name cannot be empty")

    item.name = term_name
    if hasattr(item, "specialty") and data.specialty is not None:
        item.specialty = data.specialty.strip()
    if hasattr(item, "test_type") and data.test_type is not None:
        item.test_type = data.test_type.strip()

    db.commit()
    db.refresh(item)
    return DictionaryTermResponse.model_validate(item)


@router.delete("/dictionary/{category}/{item_id}")
async def deactivate_dictionary_term(
    category: str,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR]))
):
    """Deactivate (soft delete) a term from the clinical dictionary."""
    model = CATEGORY_MODEL_MAP.get(category.lower())
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid category '{category}'")

    item = db.query(model).filter(model.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Dictionary item not found")

    item.is_active = False
    db.commit()
    return {"message": f"Term '{item.name}' deactivated successfully"}


# ============================================================================
# 4. MY PROFILE MANAGEMENT
# ============================================================================

@router.get("/profile", response_model=StaffResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    """Get the currently logged-in user's profile information."""
    return current_user


@router.put("/profile", response_model=StaffResponse)
async def update_my_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user personal details (name, email, phone)."""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.full_name:
        user.full_name = data.full_name.strip()
    if data.email:
        existing = db.query(User).filter(User.email == data.email.strip(), User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already used by another user")
        user.email = data.email.strip()
    if data.phone is not None:
        user.phone = data.phone.strip() if data.phone else None

    db.commit()
    db.refresh(user)
    return user


@router.post("/profile/change-password")
async def change_my_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change the logged in user's own password."""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password does not match")

    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters")

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
