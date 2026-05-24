import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.user import User
from app.models.enums import UserRole
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateUpdate, TemplateResponse

router = APIRouter()

@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Save a new consultation template"""
    template = Template(
        doctor_id=current_user.id,
        name=template_data.name,
        chief_complaints=json.dumps(template_data.chief_complaints or []),
        diagnosis=template_data.diagnosis,
        advice=template_data.advice,
        drugs=json.dumps(template_data.drugs),
        vitals=json.dumps(template_data.vitals) if template_data.vitals else None,
        tests=json.dumps(template_data.tests) if template_data.tests else None,
        follow_up_date=template_data.follow_up_date,
        follow_up_notes=template_data.follow_up_notes
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """List all templates for the current doctor"""
    return db.query(Template).filter(Template.doctor_id == current_user.id).all()

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Get a specific template by ID"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.doctor_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template

@router.patch("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Update a consultation template."""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.doctor_id == current_user.id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    data = template_data.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        template.name = data["name"].strip()
    if "chief_complaints" in data:
        template.chief_complaints = json.dumps(data["chief_complaints"] or [])
    if "diagnosis" in data:
        template.diagnosis = data["diagnosis"]
    if "advice" in data:
        template.advice = data["advice"]
    if "drugs" in data:
        template.drugs = json.dumps(data["drugs"] or [])
    if "vitals" in data:
        template.vitals = json.dumps(data["vitals"]) if data["vitals"] else None
    if "tests" in data:
        template.tests = json.dumps(data["tests"]) if data["tests"] else None
    if "follow_up_date" in data:
        template.follow_up_date = data["follow_up_date"]
    if "follow_up_notes" in data:
        template.follow_up_notes = data["follow_up_notes"]

    db.commit()
    db.refresh(template)
    return template

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """Delete a template"""
    template = db.query(Template).filter(
        Template.id == template_id, 
        Template.doctor_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    db.delete(template)
    db.commit()
    return None
