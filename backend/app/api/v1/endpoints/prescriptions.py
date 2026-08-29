import json
from datetime import datetime, date, timedelta
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole, VisitStatus, TestStatus
from app.models.visit import Visit
from app.models.prescription import Prescription, PrescriptionDrug
from app.models.visit_relations import VisitPayment
from app.models.test import Test
from app.models.patient_history import (
    PatientAllergyHistory,
    PatientPastHistory,
    PatientSurgicalHistory,
    PatientFamilyHistory,
)
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.schemas.consultation import (
    FullPrescriptionPayload,
    FullPrescriptionResponse,
    RXDrugItem,
    PatientHistoryPayload,
    ClinicalAssessmentPayload,
    BillingAndPlanPayload,
)

router = APIRouter()


@router.post("/full", response_model=FullPrescriptionResponse, status_code=status.HTTP_200_OK)
async def save_full_prescription(
    payload: FullPrescriptionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN])),
):
    """
    Atomic transaction to save the full RX Consultation payload:
    - Prescription & RX Medication Table
    - Clinical Assessment (Complaints, Diagnosis, Examination)
    - Patient History (Allergies, Past, Family, Surgical)
    - Plan, Billing & Follow-up
    - Tests Ordered
    - Visit Status updates
    """
    visit = db.query(Visit).options(joinedload(Visit.patient)).filter(Visit.id == payload.visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # 1. Update Visit Clinical Fields
    if payload.consultant_name:
        visit.consultant_assigned = payload.consultant_name
    
    # 1. Update Structured Diagnoses & Comma-Safe formatting
    if payload.assessment and payload.assessment.diagnosis is not None:
        raw_diag = payload.assessment.diagnosis
        if isinstance(raw_diag, list):
            diag_names = []
            for d in raw_diag:
                if isinstance(d, dict):
                    d_code = d.get("code")
                    d_name = d.get("name") or ""
                    if d_code and d_name:
                        diag_names.append(f"[{d_code}] {d_name}")
                    else:
                        diag_names.append(d_name or d_code or "")
                elif hasattr(d, "name") or hasattr(d, "code"):
                    d_code = getattr(d, "code", None)
                    d_name = getattr(d, "name", "")
                    if d_code and d_name:
                        diag_names.append(f"[{d_code}] {d_name}")
                    else:
                        diag_names.append(d_name or d_code or "")
                else:
                    diag_names.append(str(d).strip())

            # Safe string representation with pipe separator to keep multi-word terms intact
            visit.diagnosis = " | ".join([n for n in diag_names if n])
    
    # 2. Update Structured Complaints JSON
    if payload.assessment and payload.assessment.complaints is not None:
        raw_comp = payload.assessment.complaints
        visit.chief_complaints = json.dumps([
            c.model_dump() if hasattr(c, "model_dump") else c
            for c in raw_comp
        ])
    
    # Advice & Examination
    combined_advice = (payload.plan_and_billing.advice if payload.plan_and_billing else "") or ""
    if payload.assessment and payload.assessment.examination:
        combined_advice = f"[Examination]: {payload.assessment.examination}\n{combined_advice}".strip()
    visit.advice = combined_advice
    
    # Follow-up Date parsing
    f_date = payload.plan_and_billing.followup_date if payload.plan_and_billing else None
    if f_date:
        if isinstance(f_date, str) and f_date.strip():
            try:
                visit.follow_up_date = datetime.strptime(f_date.strip(), "%Y-%m-%d")
            except Exception:
                pass
        elif isinstance(f_date, (date, datetime)):
            visit.follow_up_date = datetime.combine(f_date, datetime.min.time()) if isinstance(f_date, date) else f_date
    elif payload.plan_and_billing and payload.plan_and_billing.for_followup and payload.plan_and_billing.followup_duration:
        try:
            days = int(payload.plan_and_billing.followup_duration)
            if payload.plan_and_billing.followup_unit == "Weeks":
                days *= 7
            elif payload.plan_and_billing.followup_unit == "Months":
                days *= 30
            visit.follow_up_date = datetime.now() + timedelta(days=days)
        except Exception:
            pass
    
    if payload.plan_and_billing and payload.plan_and_billing.notes:
        visit.follow_up_notes = payload.plan_and_billing.notes

    # Status State Machine
    status_map = {
        "completed": VisitStatus.COMPLETED.value,
        "save": VisitStatus.IN_CONSULTATION.value,
        "save_draft": VisitStatus.IN_CONSULTATION.value,
        "pending": VisitStatus.IN_CONSULTATION.value,
        "hold": VisitStatus.REPORTS_PENDING.value,
        "send_to_lab": VisitStatus.REPORTS_PENDING.value,
        "reports_pending": VisitStatus.REPORTS_PENDING.value,
        "reports_ready": VisitStatus.REPORTS_READY.value,
        "followup": VisitStatus.CONSULTED.value,
        "reminder": VisitStatus.IN_CONSULTATION.value,
        "not_visited": VisitStatus.REGISTERED.value,
    }
    visit.status = status_map.get(payload.status_action, VisitStatus.COMPLETED.value)
    visit.doctor_id = current_user.id
    visit.updated_at = datetime.utcnow()

    # 3. Upsert Prescription Entity
    prescription = db.query(Prescription).filter(Prescription.visit_id == payload.visit_id).first()
    if not prescription:
        prescription = Prescription(
            visit_id=payload.visit_id,
            doctor_id=current_user.id,
            created_at=datetime.utcnow(),
        )
        db.add(prescription)
        db.flush()

    if payload.print_requested:
        prescription.printed_at = datetime.utcnow()

    # 4. IDEMPOTENT NON-DESTRUCTIVE DRUG DIFF ENGINE
    existing_drugs = {d.id: d for d in prescription.drugs} if prescription.drugs else {}
    incoming_medicines = payload.medicines or []
    retained_drug_ids = set()
    saved_medicines: List[RXDrugItem] = []
    today = date.today()

    for idx, drug_data in enumerate(incoming_medicines, start=1):
        num_days = max(1, drug_data.days or 1)
        drug_id = getattr(drug_data, "id", None)

        matched_existing = None
        if drug_id and drug_id in existing_drugs:
            matched_existing = existing_drugs[drug_id]
        elif not drug_id:
            for ex_id, ex_drug in existing_drugs.items():
                if ex_id not in retained_drug_ids and (
                    ex_drug.s_no == (drug_data.s_no or idx) or
                    ex_drug.drug_name.strip().lower() == drug_data.drug_name.strip().lower()
                ):
                    matched_existing = ex_drug
                    break

        if matched_existing:
            # In-Place Update (Preserves existing primary key ID)
            matched_existing.s_no = drug_data.s_no or idx
            matched_existing.brand_name = drug_data.brand_name
            matched_existing.drug_name = drug_data.drug_name
            matched_existing.dosage = drug_data.dosage or "1 Tab"
            matched_existing.frequency = drug_data.frequency or "TDS (1-1-1)"
            matched_existing.instructions = drug_data.instructions or "After food"
            matched_existing.number_of_days = num_days
            matched_existing.end_date = today + timedelta(days=num_days)
            matched_existing.quantity = drug_data.quantity or 1
            retained_drug_ids.add(matched_existing.id)

            saved_medicines.append(
                RXDrugItem(
                    id=matched_existing.id,
                    s_no=matched_existing.s_no,
                    brand_name=matched_existing.brand_name,
                    drug_name=matched_existing.drug_name,
                    dosage=matched_existing.dosage,
                    frequency=matched_existing.frequency,
                    days=matched_existing.number_of_days,
                    instructions=matched_existing.instructions,
                    quantity=matched_existing.quantity,
                )
            )
        else:
            # Insert New Medication Row
            new_drug = PrescriptionDrug(
                prescription_id=prescription.id,
                s_no=drug_data.s_no or idx,
                brand_name=drug_data.brand_name,
                drug_name=drug_data.drug_name,
                dosage=drug_data.dosage or "1 Tab",
                frequency=drug_data.frequency or "TDS (1-1-1)",
                instructions=drug_data.instructions or "After food",
                start_date=today,
                number_of_days=num_days,
                end_date=today + timedelta(days=num_days),
                quantity=drug_data.quantity or 1,
            )
            db.add(new_drug)
            db.flush()
            retained_drug_ids.add(new_drug.id)

            saved_medicines.append(
                RXDrugItem(
                    id=new_drug.id,
                    s_no=new_drug.s_no,
                    brand_name=new_drug.brand_name,
                    drug_name=new_drug.drug_name,
                    dosage=new_drug.dosage,
                    frequency=new_drug.frequency,
                    days=new_drug.number_of_days,
                    instructions=new_drug.instructions,
                    quantity=new_drug.quantity,
                )
            )

    # Delete ONLY drugs that were explicitly removed by doctor
    for d_id, d_obj in existing_drugs.items():
        if d_id not in retained_drug_ids:
            db.delete(d_obj)

    # 3. Update Patient History Tags (Non-destructive upsert)
    p_id = visit.patient_id
    if payload.history:
        # ONLY update allergies if explicitly provided and non-empty
        if payload.history.allergy_history is not None and len(payload.history.allergy_history) > 0:
            for item in payload.history.allergy_history:
                val_clean = str(item).strip()
                if val_clean:
                    # Check if allergy already recorded to prevent duplicate rows
                    exists = db.query(PatientAllergyHistory).filter(
                        PatientAllergyHistory.patient_id == p_id,
                        PatientAllergyHistory.value.ilike(val_clean)
                    ).first()
                    if not exists:
                        db.add(PatientAllergyHistory(patient_id=p_id, value=val_clean))

        if payload.history.past_history is not None and len(payload.history.past_history) > 0:
            for item in payload.history.past_history:
                val_clean = str(item).strip()
                if val_clean:
                    exists = db.query(PatientPastHistory).filter(
                        PatientPastHistory.patient_id == p_id,
                        PatientPastHistory.value.ilike(val_clean)
                    ).first()
                    if not exists:
                        db.add(PatientPastHistory(patient_id=p_id, value=val_clean))

        if payload.history.surgical_history is not None and len(payload.history.surgical_history) > 0:
            for item in payload.history.surgical_history:
                val_clean = str(item).strip()
                if val_clean:
                    exists = db.query(PatientSurgicalHistory).filter(
                        PatientSurgicalHistory.patient_id == p_id,
                        PatientSurgicalHistory.value.ilike(val_clean)
                    ).first()
                    if not exists:
                        db.add(PatientSurgicalHistory(patient_id=p_id, value=val_clean))

        if payload.history.family_history is not None and len(payload.history.family_history) > 0:
            for item in payload.history.family_history:
                val_clean = str(item).strip()
                if val_clean:
                    exists = db.query(PatientFamilyHistory).filter(
                        PatientFamilyHistory.patient_id == p_id,
                        PatientFamilyHistory.value.ilike(val_clean)
                    ).first()
                    if not exists:
                        db.add(PatientFamilyHistory(patient_id=p_id, value=val_clean))

    # 4. Save Ordered Diagnostic Tests
    if payload.plan_and_billing and payload.plan_and_billing.investigations_next_visit:
        for t_name in payload.plan_and_billing.investigations_next_visit:
            if t_name and str(t_name).strip():
                clean_name = str(t_name).strip()
                existing_t = db.query(Test).filter(Test.visit_id == payload.visit_id, Test.test_name == clean_name).first()
                if not existing_t:
                    db.add(Test(
                        visit_id=payload.visit_id,
                        test_type="Diagnostic Investigation",
                        test_name=clean_name,
                        status=TestStatus.ORDERED.value,
                    ))

    # 5. Upsert Billing / Fees
    if payload.plan_and_billing:
        payment = db.query(VisitPayment).filter(VisitPayment.visit_id == payload.visit_id).first()
        if not payment:
            payment = VisitPayment(visit_id=payload.visit_id)
            db.add(payment)
        
        payment.doctor_fee = payload.plan_and_billing.doctor_fee or 0.0
        payment.lab_fee = (payload.plan_and_billing.dressing_fee or 0.0) + (payload.plan_and_billing.procedure_fee or 0.0)
        payment.total = payload.plan_and_billing.total_amount or 0.0
        payment.payment_mode = payload.plan_and_billing.payment_mode or "Cash"
        payment.payment_status = payload.plan_and_billing.payment_status or "paid"

    db.commit()
    db.refresh(prescription)
    db.refresh(visit)

    return FullPrescriptionResponse(
        prescription_id=prescription.id,
        visit_id=visit.id,
        patient_id=visit.patient_id,
        visit_number=visit.visit_number or f"VIS-{visit.id}",
        created_at=prescription.created_at or visit.created_at or datetime.utcnow(),
        updated_at=visit.updated_at or datetime.utcnow(),
        printed_at=prescription.printed_at,
        history=payload.history or PatientHistoryPayload(),
        assessment=payload.assessment or ClinicalAssessmentPayload(),
        medicines=saved_medicines,
        plan_and_billing=payload.plan_and_billing or BillingAndPlanPayload(),
        status=visit.status,
    )


@router.get("/full/{visit_id}", response_model=FullPrescriptionResponse)
async def get_full_prescription(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch complete structured consultation prescription payload for a visit"""
    visit = db.query(Visit).options(
        joinedload(Visit.patient),
        joinedload(Visit.prescription).joinedload(Prescription.drugs),
        joinedload(Visit.payment),
    ).filter(Visit.id == visit_id).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    p_id = visit.patient_id
    allergies = [a.value for a in db.query(PatientAllergyHistory).filter(PatientAllergyHistory.patient_id == p_id).all()]
    past = [p.value for p in db.query(PatientPastHistory).filter(PatientPastHistory.patient_id == p_id).all()]
    surgical = [s.value for s in db.query(PatientSurgicalHistory).filter(PatientSurgicalHistory.patient_id == p_id).all()]
    family = [f.value for f in db.query(PatientFamilyHistory).filter(PatientFamilyHistory.patient_id == p_id).all()]

    # Parse complaints
    complaints = []
    if visit.chief_complaints:
        try:
            complaints = json.loads(visit.chief_complaints)
            if not isinstance(complaints, list):
                complaints = [{"complaint": str(visit.chief_complaints)}]
        except Exception:
            complaints = [{"complaint": str(visit.chief_complaints)}]

    # Parse structured diagnoses safely
    diagnoses = []
    if visit.diagnosis:
        if " | " in visit.diagnosis:
            diagnoses = [d.strip() for d in visit.diagnosis.split(" | ") if d.strip()]
        elif "," in visit.diagnosis:
            diagnoses = [d.strip() for d in visit.diagnosis.split(",") if d.strip()]
        else:
            diagnoses = [visit.diagnosis.strip()] if visit.diagnosis.strip() else []

    # Parse ordered tests
    ordered_tests = [t.test_name for t in db.query(Test).filter(Test.visit_id == visit_id).all()]

    medicines = []
    if visit.prescription and visit.prescription.drugs:
        for idx, d in enumerate(visit.prescription.drugs, start=1):
            medicines.append(RXDrugItem(
                id=d.id,
                s_no=d.s_no or idx,
                brand_name=d.brand_name,
                drug_name=d.drug_name,
                dosage=d.dosage or "1 Tab",
                frequency=d.frequency or "TDS (1-1-1)",
                days=d.number_of_days or 1,
                instructions=d.instructions or "After food",
                quantity=d.quantity or 1,
            ))

    # Clean advice / examination separation if previously merged
    clean_advice = visit.advice or ""
    clean_exam = ""
    if "[Examination]:" in clean_advice:
        parts = clean_advice.split("\n", 1)
        clean_exam = parts[0].replace("[Examination]:", "").strip()
        clean_advice = parts[1].strip() if len(parts) > 1 else ""

    # Safe payment record retrieval
    payment_record = None
    if visit.payment and len(visit.payment) > 0:
        payment_record = visit.payment[0]
    else:
        payment_record = db.query(VisitPayment).filter(VisitPayment.visit_id == visit_id).first()

    plan = BillingAndPlanPayload(
        lab_reports_reviewed=visit.laboratory_reports,
        notes=visit.follow_up_notes,
        advice=clean_advice,
        investigations_next_visit=ordered_tests,
        followup_date=visit.follow_up_date.date() if (visit.follow_up_date and isinstance(visit.follow_up_date, datetime)) else (visit.follow_up_date if isinstance(visit.follow_up_date, date) else None),
        for_followup=bool(visit.follow_up_date),
        doctor_fee=payment_record.doctor_fee if payment_record else 0.0,
        total_amount=payment_record.total if payment_record else 0.0,
        payment_mode=payment_record.payment_mode if payment_record else "Cash",
        payment_status=payment_record.payment_status if payment_record else "paid",
    )

    created_time = (visit.prescription.created_at if visit.prescription else None) or visit.created_at or datetime.utcnow()
    updated_time = visit.updated_at or visit.created_at or datetime.utcnow()

    return FullPrescriptionResponse(
        prescription_id=visit.prescription.id if visit.prescription else None,
        visit_id=visit.id,
        patient_id=visit.patient_id,
        visit_number=visit.visit_number or f"VIS-{visit.id}",
        created_at=created_time,
        updated_at=updated_time,
        printed_at=visit.prescription.printed_at if visit.prescription else None,
        history=PatientHistoryPayload(
            past_history=past,
            allergy_history=allergies,
            personal_history=[],
            family_history=family,
            surgical_history=surgical,
        ),
        assessment=ClinicalAssessmentPayload(
            complaints=complaints,
            diagnosis=diagnoses,
            examination=clean_exam or None,
        ),
        medicines=medicines,
        plan_and_billing=plan,
        status=visit.status,
    )


@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN])),
):
    """Legacy Create prescription endpoint for backward compatibility"""
    visit = db.query(Visit).filter(Visit.id == prescription_data.visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    existing = db.query(Prescription).filter(Prescription.visit_id == prescription_data.visit_id).first()
    if existing:
        db.query(PrescriptionDrug).filter(PrescriptionDrug.prescription_id == existing.id).delete()
        db.delete(existing)
        db.commit()
    
    prescription = Prescription(
        visit_id=prescription_data.visit_id,
        doctor_id=current_user.id,
        created_at=datetime.utcnow(),
    )
    db.add(prescription)
    db.flush()
    
    for drug_data in prescription_data.drugs:
        drug = PrescriptionDrug(
            prescription_id=prescription.id,
            **drug_data.model_dump()
        )
        db.add(drug)
    
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
    """Get legacy prescription for a specific visit"""
    prescription = db.query(Prescription).filter(Prescription.visit_id == visit_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return PrescriptionResponse.model_validate(prescription)


@router.post("/{prescription_id}/print")
async def mark_prescription_as_printed(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark prescription as printed and update visit status to completed"""
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    prescription.printed_at = datetime.utcnow()
    
    # Mark visit completed if in consultation
    visit = db.query(Visit).filter(Visit.id == prescription.visit_id).first()
    if visit and visit.status != VisitStatus.COMPLETED.value:
        visit.status = VisitStatus.COMPLETED.value
        visit.updated_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Prescription marked as printed", "printed_at": prescription.printed_at}
