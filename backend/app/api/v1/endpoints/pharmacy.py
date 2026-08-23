import json
from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.visit import Visit
from app.models.prescription import Prescription, PrescriptionDrug
from app.models.pharmacy import PharmacyItem, PharmacyDispenseLog
from app.models.patient import Patient
from app.schemas.pharmacy import (
    PharmacyItemCreate,
    PharmacyItemUpdate,
    PharmacyItemResponse,
    PharmacyQueueItem,
    PrescribedMedicineMatch,
    PharmacyPrescriptionDetails,
    DispenseRequest,
    DispenseResponse,
)

router = APIRouter()


def compute_item_alerts(item: PharmacyItem) -> tuple[bool, bool, bool]:
    """Helper to compute low stock, out of stock, and near expiry flags"""
    today = date.today()
    is_out_of_stock = item.stock_quantity <= 0
    is_low_stock = item.stock_quantity > 0 and item.stock_quantity <= item.reorder_level
    is_near_expiry = item.expiry_date <= (today + timedelta(days=30))
    return is_low_stock, is_out_of_stock, is_near_expiry


# -----------------------------------------------------------------------------
# 1. Inventory Management Endpoints
# -----------------------------------------------------------------------------
@router.get("/inventory", response_model=List[PharmacyItemResponse])
async def list_pharmacy_inventory(
    q: Optional[str] = Query(None, description="Search query for brand or drug name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    stock_status: Optional[str] = Query(None, description="Filter: all, low_stock, out_of_stock, near_expiry"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTION])),
):
    """List pharmacy inventory with real-time stock alerts and keyword search"""
    query = db.query(PharmacyItem)

    if q and q.strip():
        search_str = f"%{q.strip()}%"
        query = query.filter(
            or_(
                PharmacyItem.brand_name.ilike(search_str),
                PharmacyItem.drug_name.ilike(search_str),
                PharmacyItem.batch_number.ilike(search_str),
            )
        )

    if category and category.strip() and category.lower() != "all":
        query = query.filter(PharmacyItem.category.ilike(f"%{category.strip()}%"))

    items = query.order_by(PharmacyItem.brand_name.asc()).all()

    today = date.today()
    results = []
    for item in items:
        is_low, is_out, is_near_exp = compute_item_alerts(item)

        if stock_status == "low_stock" and not is_low:
            continue
        if stock_status == "out_of_stock" and not is_out:
            continue
        if stock_status == "near_expiry" and not is_near_exp:
            continue

        resp_item = PharmacyItemResponse(
            id=item.id,
            brand_name=item.brand_name,
            drug_name=item.drug_name,
            category=item.category,
            batch_number=item.batch_number,
            expiry_date=item.expiry_date,
            stock_quantity=item.stock_quantity,
            reorder_level=item.reorder_level,
            unit_price=item.unit_price,
            is_low_stock=is_low,
            is_out_of_stock=is_out,
            is_near_expiry=is_near_exp,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        results.append(resp_item)

    return results


@router.post("/inventory", response_model=PharmacyItemResponse, status_code=status.HTTP_201_CREATED)
async def create_pharmacy_item(
    payload: PharmacyItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN])),
):
    """Add a new item to pharmacy inventory"""
    item = PharmacyItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)

    is_low, is_out, is_near_exp = compute_item_alerts(item)
    return PharmacyItemResponse(
        id=item.id,
        brand_name=item.brand_name,
        drug_name=item.drug_name,
        category=item.category,
        batch_number=item.batch_number,
        expiry_date=item.expiry_date,
        stock_quantity=item.stock_quantity,
        reorder_level=item.reorder_level,
        unit_price=item.unit_price,
        is_low_stock=is_low,
        is_out_of_stock=is_out,
        is_near_expiry=is_near_exp,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


# -----------------------------------------------------------------------------
# 2. Pharmacy Fulfillment Queue
# -----------------------------------------------------------------------------
@router.get("/queue", response_model=List[PharmacyQueueItem])
async def get_pharmacy_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTION])),
):
    """
    Fetch patient prescriptions awaiting fulfillment.
    Matches visits where doctor has completed consultation (COMPLETED / CONSULTED)
    and prescription has not yet been dispensed.
    """
    recent_cutoff = datetime.utcnow() - timedelta(days=2)

    visits = (
        db.query(Visit)
        .options(
            joinedload(Visit.patient),
            joinedload(Visit.prescription).joinedload(Prescription.drugs),
            joinedload(Visit.doctor),
        )
        .filter(
            Visit.created_at >= recent_cutoff,
            Visit.status.in_([VisitStatus.COMPLETED.value, VisitStatus.CONSULTED.value]),
        )
        .order_by(Visit.updated_at.desc(), Visit.created_at.desc())
        .all()
    )

    queue: List[PharmacyQueueItem] = []
    for v in visits:
        # Check if prescription exists and has drugs
        if not v.prescription or not v.prescription.drugs:
            continue

        patient_obj = v.patient
        pat_name = patient_obj.name if patient_obj else f"Patient #{v.patient_id}"
        formatted_id = (
            patient_obj.patient_id
            if (patient_obj and patient_obj.patient_id)
            else f"PAT-{v.patient_id:05d}"
        )

        age_val = getattr(patient_obj, "age", None) or getattr(patient_obj, "age_years", None)
        gender_val = patient_obj.gender if patient_obj else "—"
        age_sex_str = f"{age_val or '—'} Y / {gender_val[0] if gender_val else '—'}"

        doctor_name = (
            v.consultant_assigned
            or (v.doctor.full_name if v.doctor else None)
            or "Dr. T.S.Jeyagowthaman"
        )

        queue.append(
            PharmacyQueueItem(
                visit_id=v.id,
                visit_number=v.visit_number or f"VIS-{v.id}",
                patient_id=formatted_id,
                patient_name=pat_name,
                age_sex=age_sex_str,
                gender=gender_val,
                age=age_val,
                doctor_name=doctor_name,
                prescribed_at=v.prescription.created_at or v.created_at,
                items_count=len(v.prescription.drugs),
                status=v.status,
                pharmacy_status="pending",
            )
        )

    return queue


# -----------------------------------------------------------------------------
# 3. Prescription Details & Price Matching
# -----------------------------------------------------------------------------
@router.get("/prescription/{visit_id}", response_model=PharmacyPrescriptionDetails)
async def get_prescription_for_dispensing(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN, UserRole.DOCTOR])),
):
    """
    Get detailed prescription and automatically match prescribed drugs
    with the PharmacyItem inventory table to fetch unit price, stock, and total cost.
    """
    visit = (
        db.query(Visit)
        .options(
            joinedload(Visit.patient),
            joinedload(Visit.prescription).joinedload(Prescription.drugs),
            joinedload(Visit.doctor),
        )
        .filter(Visit.id == visit_id)
        .first()
    )

    if not visit or not visit.prescription:
        raise HTTPException(status_code=404, detail="Prescription not found for this visit")

    patient_obj = visit.patient
    pat_name = patient_obj.name if patient_obj else f"Patient #{visit.patient_id}"
    formatted_id = (
        patient_obj.patient_id
        if (patient_obj and patient_obj.patient_id)
        else f"PAT-{visit.patient_id:05d}"
    )

    age_val = getattr(patient_obj, "age", None) or getattr(patient_obj, "age_years", None)
    gender_val = patient_obj.gender if patient_obj else "—"
    age_sex_str = f"{age_val or '—'} Y / {gender_val}"

    doctor_name = (
        visit.consultant_assigned
        or (visit.doctor.full_name if visit.doctor else None)
        or "Dr. T.S.Jeyagowthaman"
    )

    matches: List[PrescribedMedicineMatch] = []
    total_est = 0.0
    all_in_stock = True

    for idx, drug in enumerate(visit.prescription.drugs or [], start=1):
        qty = drug.quantity or 1
        brand_query = (drug.brand_name or "").strip()
        drug_query = (drug.drug_name or "").strip()

        # Find best matching inventory item
        inventory_match = None
        if brand_query:
            # 1. Exact or prefix match on brand name
            inventory_match = (
                db.query(PharmacyItem)
                .filter(PharmacyItem.brand_name.ilike(f"{brand_query}%"))
                .order_by(PharmacyItem.stock_quantity.desc())
                .first()
            )
            if not inventory_match:
                # 2. Substring match on brand name
                inventory_match = (
                    db.query(PharmacyItem)
                    .filter(PharmacyItem.brand_name.ilike(f"%{brand_query}%"))
                    .first()
                )

        if not inventory_match and drug_query:
            # 3. Fallback match on generic drug name
            inventory_match = (
                db.query(PharmacyItem)
                .filter(PharmacyItem.drug_name.ilike(f"%{drug_query.split()[0]}%"))
                .first()
            )

        unit_p = inventory_match.unit_price if inventory_match else 5.0  # Default ₹5 if unlisted
        avail_stock = inventory_match.stock_quantity if inventory_match else 100
        line_total = round(qty * unit_p, 2)
        total_est += line_total
        has_stock = avail_stock >= qty

        if not has_stock:
            all_in_stock = False

        matches.append(
            PrescribedMedicineMatch(
                s_no=drug.s_no or idx,
                brand_name=drug.brand_name or drug.drug_name,
                drug_name=drug.drug_name or "—",
                dosage=drug.dosage or "1 Tab",
                frequency=drug.frequency or "TDS",
                days=drug.number_of_days or 1,
                quantity=qty,
                instructions=drug.instructions,
                matched_item_id=inventory_match.id if inventory_match else None,
                matched_brand_name=inventory_match.brand_name if inventory_match else None,
                batch_number=inventory_match.batch_number if inventory_match else "GEN-2026-001",
                available_stock=avail_stock,
                unit_price=unit_p,
                total_price=line_total,
                is_in_stock=has_stock,
            )
        )

    return PharmacyPrescriptionDetails(
        visit_id=visit.id,
        visit_number=visit.visit_number or f"VIS-{visit.id}",
        patient_id=formatted_id,
        patient_name=pat_name,
        age_sex=age_sex_str,
        doctor_name=doctor_name,
        prescribed_at=visit.prescription.created_at or visit.created_at,
        medicines=matches,
        total_estimated_amount=round(total_est, 2),
        can_dispense=all_in_stock,
    )


# -----------------------------------------------------------------------------
# 4. Atomic Dispensing & Billing Transaction
# -----------------------------------------------------------------------------
@router.post("/dispense/{visit_id}", response_model=DispenseResponse)
async def dispense_prescription_and_bill(
    visit_id: int,
    payload: DispenseRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN, UserRole.DOCTOR])),
):
    """
    Atomic Dispensing Transaction:
    1. Validates visit and prescription.
    2. Validates available stock for each prescribed item.
       (If quantity > stock_quantity, raises 400 Bad Request and aborts).
    3. Deducts stock_quantity atomically in PharmacyItem.
    4. Records PharmacyDispenseLog audit trail.
    5. Updates visit status to DISPENSED.
    6. Commits transaction and returns fulfillment summary.
    """
    visit = (
        db.query(Visit)
        .options(
            joinedload(Visit.prescription).joinedload(Prescription.drugs),
            joinedload(Visit.patient),
        )
        .filter(Visit.id == visit_id)
        .first()
    )

    if not visit or not visit.prescription:
        raise HTTPException(status_code=404, detail="Visit or Prescription not found")

    drugs = visit.prescription.drugs or []
    if not drugs:
        raise HTTPException(status_code=400, detail="No prescribed drugs found to dispense")

    dispensed_audit = []
    total_bill = 0.0

    # Step 1: Verify Stock Availability for All Items
    for drug in drugs:
        qty = drug.quantity or 1
        brand = (drug.brand_name or "").strip()
        generic = (drug.drug_name or "").strip()

        # Find inventory record
        item = None
        if brand:
            item = db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike(f"{brand}%")).first()
            if not item:
                item = db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike(f"%{brand}%")).first()
        if not item and generic:
            item = db.query(PharmacyItem).filter(PharmacyItem.drug_name.ilike(f"%{generic.split()[0]}%")).first()

        if item:
            if item.stock_quantity < qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{item.brand_name}'. Requested: {qty}, Available: {item.stock_quantity}",
                )

    # Step 2: Atomic Stock Deduction
    for drug in drugs:
        qty = drug.quantity or 1
        brand = (drug.brand_name or "").strip()
        generic = (drug.drug_name or "").strip()

        item = None
        if brand:
            item = db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike(f"{brand}%")).first()
            if not item:
                item = db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike(f"%{brand}%")).first()
        if not item and generic:
            item = db.query(PharmacyItem).filter(PharmacyItem.drug_name.ilike(f"%{generic.split()[0]}%")).first()

        unit_p = item.unit_price if item else 5.0
        line_total = round(qty * unit_p, 2)
        total_bill += line_total

        if item:
            item.stock_quantity = max(0, item.stock_quantity - qty)
            item.updated_at = datetime.utcnow()

        dispensed_audit.append({
            "brand_name": brand or (item.brand_name if item else generic),
            "drug_name": generic,
            "quantity": qty,
            "unit_price": unit_p,
            "line_total": line_total,
            "batch_number": item.batch_number if item else "N/A",
        })

    # Step 3: Record Audit Log
    pmode = (payload.payment_mode if payload else None) or "Cash"
    dispense_log = PharmacyDispenseLog(
        visit_id=visit.id,
        prescription_id=visit.prescription.id,
        pharmacist_id=current_user.id,
        total_amount=round(total_bill, 2),
        payment_mode=pmode,
        items_json=json.dumps(dispensed_audit),
        dispensed_at=datetime.utcnow(),
    )
    db.add(dispense_log)

    # Step 4: Update Visit Status
    visit.status = VisitStatus.DISPENSED.value
    visit.updated_at = datetime.utcnow()

    # Commit atomic transaction
    db.commit()

    return DispenseResponse(
        success=True,
        message=f"Prescription successfully dispensed. Total Amount: ₹{total_bill:.2f}",
        visit_id=visit.id,
        total_items_dispensed=len(drugs),
        total_amount=round(total_bill, 2),
        payment_mode=pmode,
        dispensed_at=dispense_log.dispensed_at,
    )
