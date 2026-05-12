from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole, TestStatus
from app.models.visit import Visit
from app.models.test import Test
from app.schemas.test import TestCreate, TestResponse, TestUpdate

router = APIRouter()


@router.post("/", response_model=TestResponse, status_code=status.HTTP_201_CREATED)
async def create_test(
    test_data: TestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Order a test for a visit"""
    # Verify visit exists
    visit = db.query(Visit).filter(Visit.id == test_data.visit_id).first()
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    
    test = Test(**test_data.dict())
    db.add(test)
    db.commit()
    db.refresh(test)
    
    return TestResponse.model_validate(test)


@router.get("/visit/{visit_id}", response_model=List[TestResponse])
async def get_tests_by_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tests for a specific visit"""
    tests = db.query(Test).filter(Test.visit_id == visit_id).all()
    return [TestResponse.model_validate(t) for t in tests]


@router.get("/pending", response_model=List[TestResponse])
async def get_pending_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LAB, UserRole.ADMIN]))
):
    """Get all pending tests for lab staff"""
    tests = db.query(Test).filter(
        Test.status.in_([TestStatus.ORDERED.value, TestStatus.IN_PROGRESS.value])
    ).order_by(Test.ordered_at.asc()).all()
    
    return [TestResponse.model_validate(t) for t in tests]


@router.patch("/{test_id}", response_model=TestResponse)
async def update_test(
    test_id: int,
    test_update: TestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LAB, UserRole.ADMIN]))
):
    """Update test results (lab staff)"""
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found"
        )
    
    update_data = test_update.dict(exclude_unset=True)
    
    # If status is being set to completed, set completed_at
    if "status" in update_data and update_data["status"] == TestStatus.COMPLETED.value:
        update_data["completed_at"] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(test, field, value)
    
    db.commit()
    db.refresh(test)
    
    return TestResponse.model_validate(test)
