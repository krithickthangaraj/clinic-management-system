import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.user import User
from app.models.enums import UserRole
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateResponse

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
        drugs=json.dumps(template_data.drugs)
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
