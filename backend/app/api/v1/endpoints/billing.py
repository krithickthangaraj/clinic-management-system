import json
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.dependencies import require_role, get_current_user
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.visit_relations import VisitPayment
from app.models.test import Test
from app.models.lab import LabTestMaster, LabOrder
from app.models.prescription import Prescription, PrescriptionDrug
from app.models.pharmacy import PharmacyItem, PharmacyDispenseLog
from app.models.invoice import Invoice, InvoiceItem
from app.schemas.invoice import (
    ServiceLineItem,
    POSBillingRollupSummary,
    InvoiceSettlementPayload,
    InvoiceResponse,
    InvoiceItemResponse,
)

router = APIRouter()


@router.get("/visit/{visit_id}/summary", response_model=POSBillingRollupSummary)
async def get_visit_billing_rollup_summary(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate Real-Time 3-Tier Visit Billing Rollup Summary:
    1. Doctor Consultation Fee (from VisitPayment or standard OPD rate)
    2. Diagnostic Lab Investigations (from Test/LabOrder catalog)
    3. Dispensed Pharmacy Medications (from PharmacyItem/Prescription)
    """
    visit = (
        db.query(Visit)
        .options(
            joinedload(Visit.patient),
            joinedload(Visit.doctor),
            joinedload(Visit.tests),
            joinedload(Visit.prescription).joinedload(Prescription.drugs),
            joinedload(Visit.payment),
        )
        .filter(Visit.id == visit_id)
        .first()
    )

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    patient = visit.patient
    uhid = patient.patient_id if patient and patient.patient_id else f"PAT-{patient.id:05d}"
    patient_name = patient.name if patient else "Walk-in Patient"
    age_sex = f"{patient.age or '—'} Y • {patient.gender or '—'}" if patient else ""
    doctor_name = visit.consultant_assigned or (visit.doctor.full_name if visit.doctor else "Attending Doctor")

    line_items: List[ServiceLineItem] = []

    # 1. Tier 1: Doctor Consultation Fee
    consultation_fee = 0.0
    payment_rec = None
    if visit.payment and len(visit.payment) > 0:
        payment_rec = visit.payment[0]
    else:
        payment_rec = db.query(VisitPayment).filter(VisitPayment.visit_id == visit_id).first()

    if payment_rec and payment_rec.doctor_fee and payment_rec.doctor_fee > 0:
        consultation_fee = float(payment_rec.doctor_fee)
    else:
        consultation_fee = 200.0  # Default standard OPD consultation

    line_items.append(
        ServiceLineItem(
            category="CONSULTATION",
            item_name="Doctor Consultation Fee",
            quantity=1,
            unit_price=consultation_fee,
            subtotal=consultation_fee,
        )
    )

    # 2. Tier 2: Diagnostic Laboratory Tests
    lab_total = 0.0
    # Check ordered tests
    tests = visit.tests or db.query(Test).filter(Test.visit_id == visit_id).all()
    # Also check LabOrder if any
    lab_order = db.query(LabOrder).filter(LabOrder.visit_id == visit_id).first()

    if tests and len(tests) > 0:
        for t in tests:
            # Lookup price in master
            t_master = db.query(LabTestMaster).filter(LabTestMaster.test_name.ilike(f"%{t.test_name.strip()}%")).first()
            test_price = float(t_master.price) if t_master and t_master.price else (250.0 if "CBC" in t.test_name or "Blood" in t.test_name else 200.0)
            lab_total += test_price
            line_items.append(
                ServiceLineItem(
                    category="LABORATORY",
                    item_name=t.test_name,
                    quantity=1,
                    unit_price=test_price,
                    subtotal=test_price,
                )
            )
    elif lab_order and lab_order.total_amount and lab_order.total_amount > 0:
        lab_total = float(lab_order.total_amount)
        line_items.append(
            ServiceLineItem(
                category="LABORATORY",
                item_name="Diagnostic Investigations Package",
                quantity=1,
                unit_price=lab_total,
                subtotal=lab_total,
            )
        )

    # 3. Tier 3: Dispensed Pharmacy Medications
    pharmacy_total = 0.0
    # Check if there are dispense logs first
    dispense_logs = (
        db.query(PharmacyDispenseLog)
        .filter(PharmacyDispenseLog.visit_id == visit_id)
        .all()
    )

    if dispense_logs and len(dispense_logs) > 0:
        for d in dispense_logs:
            if d.total_amount:
                pharmacy_total += float(d.total_amount)
            if d.items_json:
                try:
                    parsed_items = json.loads(d.items_json)
                    for pi in parsed_items:
                        line_items.append(
                            ServiceLineItem(
                                category="PHARMACY",
                                item_name=pi.get("drug_name") or pi.get("brand_name") or "Prescribed Medicine",
                                quantity=pi.get("quantity") or 1,
                                unit_price=float(pi.get("unit_price") or 4.0),
                                subtotal=float(pi.get("subtotal") or ((pi.get("quantity") or 1) * (pi.get("unit_price") or 4.0))),
                            )
                        )
                except Exception:
                    line_items.append(
                        ServiceLineItem(
                            category="PHARMACY",
                            item_name="Dispensed Medications",
                            quantity=1,
                            unit_price=float(d.total_amount),
                            subtotal=float(d.total_amount),
                        )
                    )
    elif visit.prescription and visit.prescription.drugs:
        for d in visit.prescription.drugs:
            qty = d.quantity or (max(1, d.number_of_days or 1) * 2)
            # Find matching item in inventory
            p_item = db.query(PharmacyItem).filter(
                (PharmacyItem.drug_name.ilike(f"%{d.drug_name.strip()}%")) |
                (PharmacyItem.brand_name.ilike(f"%{d.drug_name.strip()}%"))
            ).first()
            rate = float(p_item.unit_price) if p_item and p_item.unit_price else (4.0 if "Telmisartan" in d.drug_name else (2.5 if "Metformin" in d.drug_name else 3.0))
            sub = round(qty * rate, 2)
            pharmacy_total += sub
            line_items.append(
                ServiceLineItem(
                    category="PHARMACY",
                    item_name=d.drug_name,
                    quantity=qty,
                    unit_price=rate,
                    subtotal=sub,
                )
            )

    gross_total = round(consultation_fee + lab_total + pharmacy_total, 2)

    return POSBillingRollupSummary(
        visit_id=visit.id,
        patient_id=patient.id if patient else 0,
        uhid=uhid,
        patient_name=patient_name,
        age_sex=age_sex,
        doctor_name=doctor_name,
        consultation_fee=round(consultation_fee, 2),
        lab_total=round(lab_total, 2),
        pharmacy_total=round(pharmacy_total, 2),
        gross_total=gross_total,
        line_items=line_items,
    )


@router.post("/invoices/settle", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def settle_master_invoice(
    payload: InvoiceSettlementPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.RECEPTION, UserRole.ADMIN, UserRole.PHARMACY, UserRole.DOCTOR])),
):
    """
    Atomic Master Billing Settlement:
    1. Generates sequential invoice number: INV-YYYYMMDD-XXXX.
    2. Creates master Invoice record and individual InvoiceItem rows.
    3. Updates VisitPayment total and status to paid.
    4. Transitions visit status to COMPLETED.
    """
    today_str = datetime.now().strftime("%Y%m%d")
    count_today = db.query(Invoice).filter(Invoice.invoice_number.like(f"INV-{today_str}-%")).count()
    invoice_no = f"INV-{today_str}-{(count_today + 1):04d}"

    invoice = Invoice(
        invoice_number=invoice_no,
        visit_id=payload.visit_id,
        patient_id=payload.patient_id,
        cashier_id=current_user.id,
        subtotal=payload.subtotal,
        discount_amount=payload.discount_amount,
        discount_percentage=payload.discount_percentage or 0.0,
        tax_amount=payload.tax_amount,
        grand_total=payload.grand_total,
        payment_mode=payload.payment_mode,
        payment_status="PAID",
        transaction_reference=payload.transaction_reference,
        cashier_notes=payload.cashier_notes,
        created_at=datetime.utcnow(),
    )
    db.add(invoice)
    db.flush()

    saved_items: List[InvoiceItemResponse] = []
    for item in payload.items or []:
        inv_item = InvoiceItem(
            invoice_id=invoice.id,
            category=item.category,
            item_name=item.item_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
        )
        db.add(inv_item)
        db.flush()
        saved_items.append(InvoiceItemResponse.model_validate(inv_item))

    # Update or create VisitPayment
    v_payment = db.query(VisitPayment).filter(VisitPayment.visit_id == payload.visit_id).first()
    if not v_payment:
        v_payment = VisitPayment(visit_id=payload.visit_id)
        db.add(v_payment)

    v_payment.total = payload.grand_total
    v_payment.payment_status = "paid"
    v_payment.payment_mode = payload.payment_mode

    # Transition Visit status
    visit = db.query(Visit).filter(Visit.id == payload.visit_id).first()
    if visit and visit.status != VisitStatus.COMPLETED.value:
        visit.status = VisitStatus.COMPLETED.value
        visit.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(invoice)

    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        visit_id=invoice.visit_id,
        patient_id=invoice.patient_id,
        cashier_id=invoice.cashier_id,
        subtotal=invoice.subtotal,
        discount_amount=invoice.discount_amount,
        discount_percentage=invoice.discount_percentage,
        tax_amount=invoice.tax_amount,
        grand_total=invoice.grand_total,
        payment_mode=invoice.payment_mode,
        payment_status=invoice.payment_status,
        transaction_reference=invoice.transaction_reference,
        cashier_notes=invoice.cashier_notes,
        created_at=invoice.created_at,
        items=saved_items,
    )


@router.get("/invoices/visit/{visit_id}", response_model=Optional[InvoiceResponse])
async def get_invoice_by_visit_id(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch settled invoice for a specific visit"""
    invoice = (
        db.query(Invoice)
        .options(joinedload(Invoice.items))
        .filter(Invoice.visit_id == visit_id)
        .order_by(Invoice.id.desc())
        .first()
    )

    if not invoice:
        return None

    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        visit_id=invoice.visit_id,
        patient_id=invoice.patient_id,
        cashier_id=invoice.cashier_id,
        subtotal=invoice.subtotal,
        discount_amount=invoice.discount_amount,
        discount_percentage=invoice.discount_percentage,
        tax_amount=invoice.tax_amount,
        grand_total=invoice.grand_total,
        payment_mode=invoice.payment_mode,
        payment_status=invoice.payment_status,
        transaction_reference=invoice.transaction_reference,
        cashier_notes=invoice.cashier_notes,
        created_at=invoice.created_at,
        items=[InvoiceItemResponse.model_validate(it) for it in invoice.items],
    )
