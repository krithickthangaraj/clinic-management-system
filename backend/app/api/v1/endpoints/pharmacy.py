import json
from datetime import datetime, date, timedelta, time
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
from app.models.pharmacy import PharmacyItem, PharmacyDispenseLog, PharmacyStockLog
from app.models.patient import Patient
from app.schemas.pharmacy import (
    PharmacyItemCreate,
    PharmacyItemUpdate,
    PharmacyItemResponse,
    PharmacyQueueItem,
    BatchInfo,
    PrescribedMedicineMatch,
    PharmacyPrescriptionDetails,
    DispenseItemRequest,
    DispenseRequest,
    DispenseResponse,
    StockReceiveRequest,
    StockAdjustmentRequest,
    PharmacyStockLogResponse,
)

router = APIRouter()


def compute_item_alerts(item: PharmacyItem) -> tuple[bool, bool, bool]:
    """Helper to compute low stock, out of stock, and near expiry flags"""
    today = date.today()
    is_out_of_stock = item.stock_quantity <= 0
    is_low_stock = item.stock_quantity > 0 and item.stock_quantity <= item.reorder_level
    is_near_expiry = item.expiry_date <= (today + timedelta(days=30))
    return is_low_stock, is_out_of_stock, is_near_expiry


def resolve_clean_doctor_name(visit: Visit) -> str:
    """Resolve attending doctor name, rejecting 'admin' usernames."""
    if visit.consultant_assigned and "admin" not in visit.consultant_assigned.lower():
        name = visit.consultant_assigned.strip()
        return name if name.startswith("Dr.") else f"Dr. {name}"
    
    if visit.doctor and visit.doctor.full_name and "admin" not in visit.doctor.full_name.lower():
        name = visit.doctor.full_name.strip()
        return name if name.startswith("Dr.") else f"Dr. {name}"
        
    return "Dr. T.S.Jeyagowthaman"


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

    # Record initial stock log
    if item.stock_quantity > 0:
        log = PharmacyStockLog(
            item_id=item.id,
            change_type="INITIAL",
            quantity_change=item.stock_quantity,
            previous_stock=0,
            new_stock_level=item.stock_quantity,
            reason="Initial Inventory Registration",
            reference_no=f"BAT-{item.batch_number}",
            user_id=current_user.id,
        )
        db.add(log)
        db.commit()

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


@router.get("/inventory/{item_id}", response_model=PharmacyItemResponse)
async def get_pharmacy_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN, UserRole.DOCTOR])),
):
    """Get single pharmacy inventory item"""
    item = db.query(PharmacyItem).filter(PharmacyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pharmacy item not found")

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


@router.patch("/inventory/{item_id}", response_model=PharmacyItemResponse)
async def update_pharmacy_item(
    item_id: int,
    payload: PharmacyItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN])),
):
    """Edit details: price, reorder level, batch, expiry, etc."""
    item = db.query(PharmacyItem).filter(PharmacyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pharmacy item not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(item, field, val)

    item.updated_at = datetime.utcnow()
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


@router.post("/inventory/{item_id}/receive-stock", response_model=PharmacyItemResponse)
async def receive_pharmacy_stock(
    item_id: int,
    payload: StockReceiveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN])),
):
    """
    Receive Stock (Goods Receipt Note / GRN):
    Adds incoming shipment quantity to existing stock and records audit log.
    """
    item = db.query(PharmacyItem).filter(PharmacyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pharmacy item not found")

    if payload.quantity_to_add <= 0:
        raise HTTPException(status_code=400, detail="Quantity to receive must be greater than zero")

    prev_stock = item.stock_quantity
    new_stock = prev_stock + payload.quantity_to_add

    item.stock_quantity = new_stock
    if payload.batch_number:
        item.batch_number = payload.batch_number
    if payload.expiry_date:
        item.expiry_date = payload.expiry_date
    if payload.unit_price is not None and payload.unit_price > 0:
        item.unit_price = payload.unit_price

    item.updated_at = datetime.utcnow()

    # Record stock receipt log
    log = PharmacyStockLog(
        item_id=item.id,
        change_type="RECEIVE_STOCK",
        quantity_change=payload.quantity_to_add,
        previous_stock=prev_stock,
        new_stock_level=new_stock,
        reason=payload.notes or "Stock Receipt (GRN)",
        reference_no=payload.reference_no or f"GRN-{datetime.utcnow().strftime('%Y%m%d%H%M')}",
        user_id=current_user.id,
    )
    db.add(log)
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


@router.post("/inventory/{item_id}/adjust-stock", response_model=PharmacyItemResponse)
async def adjust_pharmacy_stock(
    item_id: int,
    payload: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN])),
):
    """
    Stock Adjustment (Breakage, Physical Audit, Expiry, Correction):
    Manually corrects inventory with mandatory reason and audit log.
    """
    item = db.query(PharmacyItem).filter(PharmacyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pharmacy item not found")

    if not payload.reason or not payload.reason.strip():
        raise HTTPException(status_code=400, detail="A reason is required for stock adjustment")

    prev_stock = item.stock_quantity
    adj_type = payload.adjustment_type.lower().strip()
    qty = payload.quantity

    if adj_type == "add":
        new_stock = prev_stock + qty
        change = qty
    elif adj_type == "deduct":
        new_stock = max(0, prev_stock - qty)
        change = -qty
    elif adj_type == "set":
        new_stock = max(0, qty)
        change = new_stock - prev_stock
    else:
        raise HTTPException(status_code=400, detail="Invalid adjustment type. Must be 'add', 'deduct', or 'set'.")

    item.stock_quantity = new_stock
    item.updated_at = datetime.utcnow()

    # Record stock adjustment log
    log = PharmacyStockLog(
        item_id=item.id,
        change_type="ADJUSTMENT",
        quantity_change=change,
        previous_stock=prev_stock,
        new_stock_level=new_stock,
        reason=f"{payload.reason.strip()}{f' - {payload.notes.strip()}' if payload.notes else ''}",
        reference_no=f"ADJ-{datetime.utcnow().strftime('%Y%m%d%H%M')}",
        user_id=current_user.id,
    )
    db.add(log)
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


@router.delete("/inventory/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pharmacy_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN])),
):
    """Delete an item from inventory"""
    item = db.query(PharmacyItem).filter(PharmacyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pharmacy item not found")

    db.delete(item)
    db.commit()


@router.get("/inventory/{item_id}/history", response_model=List[PharmacyStockLogResponse])
async def get_pharmacy_item_history(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN, UserRole.DOCTOR])),
):
    """Get stock movement history / audit trail for a specific item"""
    logs = (
        db.query(PharmacyStockLog)
        .filter(PharmacyStockLog.item_id == item_id)
        .order_by(PharmacyStockLog.created_at.desc())
        .limit(50)
        .all()
    )
    return logs


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
    start_today_local = datetime.combine(date.today(), time.min)
    start_today_utc = datetime.combine(datetime.utcnow().date(), time.min)
    earliest_today = min(start_today_local, start_today_utc)

    visits = (
        db.query(Visit)
        .options(
            joinedload(Visit.patient),
            joinedload(Visit.prescription).joinedload(Prescription.drugs),
            joinedload(Visit.doctor),
        )
        .filter(
            Visit.created_at >= earliest_today,
            Visit.status.in_([
                VisitStatus.COMPLETED.value,
                VisitStatus.CONSULTED.value,
                VisitStatus.DISPENSED.value,
            ]),
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

        doctor_name = resolve_clean_doctor_name(v)

        is_dispensed = str(v.status or "").lower() == VisitStatus.DISPENSED.value.lower()
        pharm_status = "dispensed" if is_dispensed else "pending"

        # Extract daily token sequence integer from visit_number (e.g. V-20260826-001 -> 1)
        token_num = None
        if getattr(v, "queue_number", None) and int(v.queue_number) > 0:
            token_num = int(v.queue_number)
        elif v.visit_number and "-" in v.visit_number:
            try:
                token_num = int(v.visit_number.split("-")[-1])
            except (ValueError, IndexError):
                token_num = None

        queue.append(
            PharmacyQueueItem(
                visit_id=v.id,
                queue_number=token_num,
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
                pharmacy_status=pharm_status,
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

    doctor_name = resolve_clean_doctor_name(visit)

    today = date.today()
    matches: List[PrescribedMedicineMatch] = []
    total_est = 0.0
    all_in_stock = True

    for idx, drug in enumerate(visit.prescription.drugs or [], start=1):
        qty = drug.quantity or 1
        brand_query = (drug.brand_name or "").strip()
        drug_query = (drug.drug_name or "").strip()

        # Query matching inventory batches: prioritize brand match first
        all_batches_raw = []
        if brand_query:
            brand_token = brand_query.split()[0]
            batches = db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike(f"{brand_token}%")).order_by(PharmacyItem.expiry_date.asc(), PharmacyItem.stock_quantity.desc()).all()
            if not batches:
                batches = db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike(f"%{brand_query}%")).order_by(PharmacyItem.expiry_date.asc(), PharmacyItem.stock_quantity.desc()).all()
            all_batches_raw = batches

        if not all_batches_raw and drug_query:
            drug_token = drug_query.split()[0]
            all_batches_raw = db.query(PharmacyItem).filter(PharmacyItem.drug_name.ilike(f"%{drug_token}%")).order_by(PharmacyItem.expiry_date.asc(), PharmacyItem.stock_quantity.desc()).all()

        available_batches_list: List[BatchInfo] = []
        recommended_batch_id = None
        fefo_found = False

        for b in all_batches_raw:
            is_near = b.expiry_date <= (today + timedelta(days=30)) if b.expiry_date else False
            months_left = None
            if b.expiry_date:
                months_left = max(0, (b.expiry_date.year - today.year) * 12 + b.expiry_date.month - today.month)

            is_fefo = False
            # First non-expired batch with available stock is FEFO recommended
            if not fefo_found and b.stock_quantity > 0 and (not b.expiry_date or b.expiry_date >= today):
                is_fefo = True
                fefo_found = True
                recommended_batch_id = b.id

            available_batches_list.append(
                BatchInfo(
                    batch_id=b.id,
                    batch_number=b.batch_number,
                    expiry_date=b.expiry_date,
                    expiry_date_str=b.expiry_date.strftime("%b %Y") if b.expiry_date else "N/A",
                    stock_quantity=b.stock_quantity,
                    unit_price=b.unit_price,
                    is_fefo_recommended=is_fefo,
                    is_near_expiry=is_near,
                    months_until_expiry=months_left,
                )
            )

        # Total available stock across all batches
        total_stock = sum(b.stock_quantity for b in all_batches_raw)
        
        # Primary selected batch
        primary_batch = None
        if recommended_batch_id:
            primary_batch = next((b for b in all_batches_raw if b.id == recommended_batch_id), None)
        if not primary_batch and all_batches_raw:
            primary_batch = all_batches_raw[0]

        unit_p = primary_batch.unit_price if primary_batch else 5.0
        avail_stock = primary_batch.stock_quantity if primary_batch else total_stock
        line_total = round(qty * unit_p, 2)
        total_est += line_total
        has_stock = total_stock >= qty

        if not has_stock:
            all_in_stock = False

        matches.append(
            PrescribedMedicineMatch(
                s_no=drug.s_no or idx,
                prescription_item_id=drug.id,
                brand_name=drug.brand_name or drug.drug_name,
                drug_name=drug.drug_name or "—",
                dosage=drug.dosage or "1 Tab",
                frequency=drug.frequency or "TDS",
                days=drug.number_of_days or 1,
                quantity=qty,
                prescribed_quantity=qty,
                instructions=drug.instructions,
                matched_item_id=primary_batch.id if primary_batch else None,
                matched_brand_name=primary_batch.brand_name if primary_batch else None,
                batch_number=primary_batch.batch_number if primary_batch else "GEN-2026-001",
                available_stock=avail_stock,
                unit_price=unit_p,
                total_price=line_total,
                is_in_stock=has_stock,
                recommended_batch_id=recommended_batch_id,
                available_batches=available_batches_list,
                total_available_stock=total_stock,
            )
        )

    # Extract daily token sequence integer
    token_num = None
    if getattr(visit, "queue_number", None) and int(visit.queue_number) > 0:
        token_num = int(visit.queue_number)
    elif visit.visit_number and "-" in visit.visit_number:
        try:
            token_num = int(visit.visit_number.split("-")[-1])
        except (ValueError, IndexError):
            token_num = None

    return PharmacyPrescriptionDetails(
        visit_id=visit.id,
        queue_number=token_num,
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
# 4. Atomic Multi-Batch & Partial Dispense Transaction
# -----------------------------------------------------------------------------
@router.post("/dispense/{visit_id}", response_model=DispenseResponse)
async def dispense_prescription_and_bill(
    visit_id: int,
    payload: Optional[DispenseRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PHARMACY, UserRole.ADMIN, UserRole.DOCTOR])),
):
    """
    Atomic Multi-Batch & Partial Dispense Transaction:
    1. Validates visit and prescription.
    2. Resolves selected batch for each item with row-level concurrency lock (with_for_update).
    3. Validates stock availability against requested partial/full quantity.
    4. Atomically deducts exact dispensed quantity and logs to PharmacyStockLog.
    5. Records PharmacyDispenseLog audit trail.
    6. Transitions visit status to DISPENSED.
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

    items_to_dispense: List[DispenseItemRequest] = []
    if payload and payload.dispensed_items:
        items_to_dispense = payload.dispensed_items
    elif payload and payload.items:
        items_to_dispense = payload.items
    else:
        # Fallback to prescription drugs
        drugs = visit.prescription.drugs or []
        if not drugs:
            raise HTTPException(status_code=400, detail="No prescribed drugs found to dispense")
        for d in drugs:
            items_to_dispense.append(
                DispenseItemRequest(
                    prescription_item_id=d.id,
                    drug_name=d.drug_name,
                    brand_name=d.brand_name,
                    prescribed_quantity=d.quantity or 1,
                    dispensed_quantity=d.quantity or 1,
                    quantity=d.quantity or 1,
                )
            )

    dispensed_audit = []
    total_bill = 0.0

    # Step 1: Atomic Row-Level Locking & Stock Verification
    locked_items = []
    for entry in items_to_dispense:
        qty_to_dispense = entry.dispensed_quantity if entry.dispensed_quantity is not None else (entry.quantity or 1)
        if qty_to_dispense <= 0:
            continue

        batch_id = entry.batch_id or entry.selected_batch_id or entry.item_id
        item = None

        if batch_id:
            item = db.query(PharmacyItem).filter(PharmacyItem.id == batch_id).with_for_update().first()
            if not item:
                raise HTTPException(status_code=404, detail=f"Pharmacy batch ID #{batch_id} not found")
        else:
            brand = (entry.brand_name or "").strip()
            generic = (entry.drug_name or "").strip()
            if brand:
                brand_token = brand.split()[0]
                item = db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike(f"{brand_token}%")).order_by(PharmacyItem.expiry_date.asc()).with_for_update().first()
                if not item:
                    item = db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike(f"%{brand}%")).order_by(PharmacyItem.expiry_date.asc()).with_for_update().first()
            if not item and generic:
                generic_token = generic.split()[0]
                item = db.query(PharmacyItem).filter(PharmacyItem.drug_name.ilike(f"%{generic_token}%")).order_by(PharmacyItem.expiry_date.asc()).with_for_update().first()

        if item:
            if item.stock_quantity < qty_to_dispense:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock in Batch #{item.batch_number} for '{item.brand_name}'. Available: {item.stock_quantity}, Requested: {qty_to_dispense}"
                )
            locked_items.append((entry, item, qty_to_dispense))
        else:
            locked_items.append((entry, None, qty_to_dispense))

    # Step 2: Atomic Stock Deduction & Stock Log Auditing
    for entry, item, qty_to_dispense in locked_items:
        unit_p = entry.unit_price if entry.unit_price is not None else (item.unit_price if item else 5.0)
        line_total = round(qty_to_dispense * unit_p, 2)
        total_bill += line_total

        if item:
            prev_stock = item.stock_quantity
            item.stock_quantity = max(0, item.stock_quantity - qty_to_dispense)
            item.updated_at = datetime.utcnow()

            # Record stock deduction log
            stock_log = PharmacyStockLog(
                item_id=item.id,
                change_type="DISPENSE",
                quantity_change=-qty_to_dispense,
                previous_stock=prev_stock,
                new_stock_level=item.stock_quantity,
                reason=f"Dispensed for Visit #{visit.id} (Token #{visit.visit_number})",
                reference_no=f"RX-{visit.prescription.id}",
                user_id=current_user.id
            )
            db.add(stock_log)

        dispensed_audit.append({
            "prescription_item_id": entry.prescription_item_id,
            "drug_name": entry.drug_name or (item.drug_name if item else "—"),
            "brand_name": entry.brand_name or (item.brand_name if item else "—"),
            "batch_id": item.id if item else None,
            "batch_number": item.batch_number if item else "N/A",
            "prescribed_quantity": entry.prescribed_quantity or qty_to_dispense,
            "dispensed_quantity": qty_to_dispense,
            "is_partial": bool(entry.prescribed_quantity and qty_to_dispense < entry.prescribed_quantity),
            "unit_price": unit_p,
            "line_total": line_total,
        })

    # Step 3: Record Audit Log
    pmode = (payload.payment_mode if payload and payload.payment_mode else "Cash")
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
        message=f"Prescription dispensed successfully. Total Amount: ₹{total_bill:.2f}",
        visit_id=visit.id,
        total_items_dispensed=len(dispensed_audit),
        total_amount=round(total_bill, 2),
        payment_mode=pmode,
        dispensed_at=dispense_log.dispensed_at,
    )
