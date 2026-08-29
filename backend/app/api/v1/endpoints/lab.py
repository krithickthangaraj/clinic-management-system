from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole, TestStatus, VisitStatus
from app.models.visit import Visit
from app.models.patient import Patient
from app.models.test import Test
from app.models.lab import LabTestMaster, LabOrder, LabResult
from app.schemas.lab import (
    LabTestMasterResponse,
    LabTestMasterCreate,
    LabTestMasterUpdate,
    LabQueueItem,
    LabParameterEntry,
    LabOrderFinalizePayload,
    LabOrderDetailsResponse,
    LabOrderFinalizeRequest,
    LabOrderFinalizeResponse,
    LabResultResponse,
)

router = APIRouter()


# =============================================================================
# 1. Lab Test Master Dictionary Endpoints
# =============================================================================

@router.get("/tests/master", response_model=List[LabTestMasterResponse])
async def list_lab_test_master(
    search: Optional[str] = None,
    category: Optional[str] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List lab test master definitions with search and category filtering."""
    query = db.query(LabTestMaster)
    if not include_inactive:
        query = query.filter(LabTestMaster.is_active == True)

    if category and category.strip() and category.lower() != "all":
        query = query.filter(LabTestMaster.category.ilike(f"%{category.strip()}%"))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (LabTestMaster.test_name.ilike(term)) | (LabTestMaster.category.ilike(term))
        )

    return query.order_by(LabTestMaster.category.asc(), LabTestMaster.test_name.asc()).all()


@router.post("/tests/master", response_model=LabTestMasterResponse, status_code=status.HTTP_201_CREATED)
async def create_lab_test_master(
    payload: LabTestMasterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LAB, UserRole.ADMIN])),
):
    """Create a new standard lab test in the clinical dictionary."""
    name_clean = payload.test_name.strip()
    existing = db.query(LabTestMaster).filter(LabTestMaster.test_name.ilike(name_clean)).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            existing.category = payload.category
            existing.normal_range = payload.normal_range
            existing.unit = payload.unit
            existing.price = payload.price
            db.commit()
            db.refresh(existing)
            return existing
        raise HTTPException(status_code=400, detail="A lab test with this name already exists")

    item = LabTestMaster(
        test_name=name_clean,
        category=payload.category,
        normal_range=payload.normal_range,
        unit=payload.unit,
        price=payload.price,
        is_active=True,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/tests/master/{item_id}", response_model=LabTestMasterResponse)
async def update_lab_test_master(
    item_id: int,
    payload: LabTestMasterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LAB, UserRole.ADMIN])),
):
    """Update lab test reference ranges, price, or active status."""
    item = db.query(LabTestMaster).filter(LabTestMaster.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Lab test not found")

    if payload.test_name is not None and payload.test_name.strip():
        name_clean = payload.test_name.strip()
        dup = db.query(LabTestMaster).filter(
            LabTestMaster.id != item_id,
            LabTestMaster.test_name.ilike(name_clean),
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Another test with this name already exists")
        item.test_name = name_clean

    if payload.category is not None:
        item.category = payload.category
    if payload.normal_range is not None:
        item.normal_range = payload.normal_range
    if payload.unit is not None:
        item.unit = payload.unit
    if payload.price is not None:
        item.price = payload.price
    if payload.is_active is not None:
        item.is_active = payload.is_active

    item.updated_at = func.now()
    db.commit()
    db.refresh(item)
    return item


# =============================================================================
# 2. Lab Queue Endpoint
# =============================================================================

@router.get("/queue", response_model=List[LabQueueItem])
async def get_lab_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LAB, UserRole.ADMIN, UserRole.DOCTOR])),
):
    """
    Fetch patient orders awaiting laboratory processing.
    Includes visits with active Test records or LabOrder in PENDING/IN_PROGRESS state.
    """
    recent_cutoff = datetime.utcnow() - timedelta(days=2)

    # 1. Visits with ordered tests
    visits = (
        db.query(Visit)
        .options(
            joinedload(Visit.patient),
            joinedload(Visit.doctor),
            joinedload(Visit.tests),
        )
        .filter(Visit.created_at >= recent_cutoff)
        .order_by(Visit.updated_at.desc(), Visit.created_at.desc())
        .all()
    )

    queue: List[LabQueueItem] = []
    seen_visits = set()

    for v in visits:
        if v.id in seen_visits:
            continue

        # Check for ordered tests
        ordered_tests_list = [
            t.test_name for t in (v.tests or [])
            if str(t.status or "").upper() in [TestStatus.ORDERED.value, TestStatus.IN_PROGRESS.value, "PENDING", "ORDERED"]
        ]
        
        # Check for existing LabOrder
        lab_order = db.query(LabOrder).filter(LabOrder.visit_id == v.id).first()
        status_clean = str(v.status or "").lower()

        # If visit status is REPORTS_READY, COMPLETED, or CONSULTED and no pending tests remain, exclude from pending lab queue
        if status_clean in [VisitStatus.REPORTS_READY.value, VisitStatus.COMPLETED.value, VisitStatus.CONSULTED.value]:
            if not ordered_tests_list:
                continue

        # If LabOrder is already COMPLETED and no pending test records remain, exclude from pending lab queue
        if lab_order and str(lab_order.status or "").upper() == "COMPLETED" and not ordered_tests_list:
            continue

        # If visit has tests ordered, status is REPORTS_PENDING, or has pending/in_progress lab order
        is_pending = False
        if ordered_tests_list:
            is_pending = True
        elif status_clean == VisitStatus.REPORTS_PENDING.value:
            is_pending = True
        elif lab_order and str(lab_order.status or "").upper() in ["PENDING", "IN_PROGRESS"]:
            is_pending = True

        if not is_pending:
            continue

        seen_visits.add(v.id)
        pat = v.patient
        pat_name = pat.name if pat else f"Patient #{v.patient_id}"
        formatted_id = pat.patient_id if (pat and pat.patient_id) else f"PAT-{v.patient_id:05d}"
        
        age_val = getattr(pat, "age", None) or getattr(pat, "age_years", None) or "—"
        gender_val = pat.gender if pat else "—"
        age_sex_str = f"{age_val} Y / {gender_val[0] if gender_val else '—'}"

        doctor_name = (
            v.consultant_assigned
            or (v.doctor.full_name if v.doctor else None)
            or "Dr. T.S.Jeyagowthaman"
        )

        all_tests_prescribed = [t.test_name for t in (v.tests or [])]
        if not all_tests_prescribed and lab_order:
            all_tests_prescribed = ["Prescribed Investigations"]

        queue.append(
            LabQueueItem(
                visit_id=v.id,
                visit_number=v.visit_number or f"VIS-{v.id}",
                patient_id=formatted_id,
                patient_name=pat_name,
                age_sex=age_sex_str,
                doctor_name=doctor_name,
                ordered_at=v.created_at,
                prescribed_tests=all_tests_prescribed,
                tests_count=len(all_tests_prescribed),
                status=lab_order.status if lab_order else "PENDING",
            )
        )

    return queue


# =============================================================================
# 3. Lab Order Details & Preparation
# =============================================================================

@router.get("/order/{visit_id}", response_model=LabOrderDetailsResponse)
async def get_lab_order_details(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LAB, UserRole.ADMIN, UserRole.DOCTOR])),
):
    """
    Get detailed lab order information for a patient visit.
    Retrieves prescribed investigations and matches them with LabTestMaster.
    """
    visit = (
        db.query(Visit)
        .options(
            joinedload(Visit.patient),
            joinedload(Visit.doctor),
            joinedload(Visit.tests),
        )
        .filter(Visit.id == visit_id)
        .first()
    )

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    pat = visit.patient
    pat_name = pat.name if pat else f"Patient #{visit.patient_id}"
    formatted_id = pat.patient_id if (pat and pat.patient_id) else f"PAT-{visit.patient_id:05d}"
    age_val = getattr(pat, "age", None) or getattr(pat, "age_years", None) or "—"
    gender_val = pat.gender if pat else "—"
    age_sex_str = f"{age_val} Y / {gender_val[0] if gender_val else '—'}"
    doctor_name = (
        visit.consultant_assigned
        or (visit.doctor.full_name if visit.doctor else None)
        or "Dr. T.S.Jeyagowthaman"
    )

    # Prescribed tests from Doctor's Desk
    prescribed_test_names = [t.test_name for t in (visit.tests or [])]

    # Active Lab Master Catalog
    available_tests = db.query(LabTestMaster).filter(LabTestMaster.is_active == True).order_by(LabTestMaster.test_name.asc()).all()

    # Existing LabOrder if any
    lab_order = (
        db.query(LabOrder)
        .options(joinedload(LabOrder.results))
        .filter(LabOrder.visit_id == visit_id)
        .first()
    )

    existing_results: List[LabResultResponse] = []
    order_status = "PENDING"
    summary_str = visit.laboratory_reports
    total_amt = 0.0

    if lab_order:
        order_status = lab_order.status
        summary_str = lab_order.summary_results or summary_str
        total_amt = lab_order.total_amount
        for r in (lab_order.results or []):
            existing_results.append(
                LabResultResponse(
                    id=r.id,
                    test_id=r.test_id,
                    test_name=r.test_name,
                    result_value=r.result_value,
                    unit=r.unit,
                    normal_range=r.normal_range,
                    is_abnormal=r.is_abnormal,
                    notes=r.notes,
                )
            )

    return LabOrderDetailsResponse(
        visit_id=visit.id,
        visit_number=visit.visit_number or f"VIS-{visit.id}",
        patient_id=formatted_id,
        patient_name=pat_name,
        age_sex=age_sex_str,
        doctor_name=doctor_name,
        status=order_status,
        prescribed_tests=prescribed_test_names,
        available_tests=[LabTestMasterResponse.model_validate(t) for t in available_tests],
        existing_results=existing_results,
        summary_results=summary_str,
        total_amount=total_amt,
    )


# =============================================================================
# 4. Finalize Lab Order & "Close the Loop"
# =============================================================================

# =============================================================================
# 4. Finalize Lab Order & "Close the Loop"
# =============================================================================

@router.post("/orders/{order_id}/finalize", response_model=LabOrderFinalizeResponse)
async def finalize_lab_order_by_id(
    order_id: int,
    payload: LabOrderFinalizePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LAB, UserRole.ADMIN])),
):
    """
    Atomic Lab Order Finalization:
    1. Updates LabOrder status to COMPLETED and stores structured parameter results.
    2. Synchronizes corresponding Test records in 'tests' table to COMPLETED.
    3. Appends structured parameter summary to Visit.laboratory_reports.
    4. Automatically transitions Visit.status to 'reports_ready'.
    5. Triggers instant 'Lab Results Ready' alert on Doctor Desk.
    """
    order = db.query(LabOrder).filter(LabOrder.id == order_id).first()
    visit = None
    if order:
        visit = db.query(Visit).options(joinedload(Visit.patient), joinedload(Visit.tests)).filter(Visit.id == order.visit_id).first()
    
    if not visit:
        target_visit_id = payload.visit_id or order_id
        visit = db.query(Visit).options(joinedload(Visit.patient), joinedload(Visit.tests)).filter(Visit.id == target_visit_id).first()
    
    if not visit:
        raise HTTPException(status_code=404, detail="Associated visit not found")

    if not order:
        order = db.query(LabOrder).filter(LabOrder.visit_id == visit.id).first()
    if not order:
        order = LabOrder(
            visit_id=visit.id,
            patient_id=visit.patient_id,
            technician_id=current_user.id,
            status="COMPLETED",
        )
        db.add(order)
        db.flush()

    order.status = "COMPLETED"
    order.technician_id = current_user.id
    order.completed_at = datetime.utcnow()

    # Clear previous results if updating
    db.query(LabResult).filter(LabResult.lab_order_id == order.id).delete()

    total_amount = order.total_amount or 0.0
    abnormal_count = 0
    summary_parts = []

    if payload.parameters:
        for param in payload.parameters:
            is_ab = param.flag in ["LOW", "HIGH", "CRITICAL"]
            if is_ab:
                abnormal_count += 1

            # Match or create master test record
            master = db.query(LabTestMaster).filter(LabTestMaster.test_name.ilike(param.parameter_name.strip())).first()
            if not master:
                master = db.query(LabTestMaster).first()

            ref_range = param.reference_range
            if not ref_range and param.reference_range_low is not None and param.reference_range_high is not None:
                ref_range = f"{param.reference_range_low} - {param.reference_range_high}"

            lab_res = LabResult(
                lab_order_id=order.id,
                test_id=master.id if master else 1,
                test_name=param.parameter_name,
                result_value=param.observed_value,
                unit=param.unit,
                normal_range=ref_range,
                is_abnormal=is_ab,
                notes=param.flag,
            )
            db.add(lab_res)

            flag_tag = f" [{param.flag.capitalize()}]" if is_ab else ""
            summary_parts.append(f"{param.parameter_name}: {param.observed_value} {param.unit or ''}{flag_tag}".strip())

    elif payload.results:
        for res in payload.results:
            master_test = db.query(LabTestMaster).filter(LabTestMaster.id == res.test_id).first()
            price = master_test.price if master_test else 0.0
            total_amount += price
            if res.is_abnormal:
                abnormal_count += 1

            lab_result = LabResult(
                lab_order_id=order.id,
                test_id=res.test_id,
                test_name=res.test_name,
                result_value=res.result_value.strip(),
                unit=res.unit or (master_test.unit if master_test else ""),
                normal_range=res.normal_range or (master_test.normal_range if master_test else ""),
                is_abnormal=res.is_abnormal,
                notes=res.notes,
            )
            db.add(lab_result)
            flag_str = " (H)" if res.is_abnormal else ""
            summary_parts.append(f"{res.test_name}: {res.result_value} {res.unit or ''}{flag_str}".strip())

    formatted_summary = payload.result_summary or " • ".join(summary_parts) or "All parameters normal."
    order.summary_results = formatted_summary

    # Synchronize 'tests' table records
    clean_test_name = payload.test_name or "Lab Test"
    db.query(Test).filter(
        Test.visit_id == visit.id,
    ).update({"status": TestStatus.COMPLETED.value, "results": formatted_summary, "completed_at": datetime.utcnow()}, synchronize_session=False)

    # Synchronize Visit laboratory_reports summary
    existing_reports = (visit.laboratory_reports or "").strip()
    if clean_test_name in existing_reports:
        visit.laboratory_reports = formatted_summary
    elif existing_reports:
        visit.laboratory_reports = f"{existing_reports}\n[{clean_test_name}]: {formatted_summary}"
    else:
        visit.laboratory_reports = formatted_summary

    # Transition Visit Status to REPORTS_READY
    visit.status = VisitStatus.REPORTS_READY.value
    visit.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(order)
    db.refresh(visit)

    patient_name = visit.patient.name if visit.patient else f"Patient #{visit.patient_id}"

    return LabOrderFinalizeResponse(
        success=True,
        message=f"Lab order for '{clean_test_name}' finalized and synchronized with Doctor Desk.",
        order_id=order.id,
        visit_id=visit.id,
        patient_name=patient_name,
        summary_results=formatted_summary,
        total_tests_processed=len(payload.parameters or payload.results or []),
        total_abnormal_flags=abnormal_count,
        total_amount=round(total_amount, 2),
        completed_at=order.completed_at,
    )


@router.post("/order/finalize", response_model=LabOrderFinalizeResponse)
async def finalize_lab_order(
    payload: LabOrderFinalizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LAB, UserRole.ADMIN])),
):
    """
    Finalize lab results and 'Close the Loop' with the Doctor's Desk:
    1. Records LabOrder and LabResult entities with abnormal flags.
    2. Formats clinical summary string (e.g. 'Hb: 11.3 g/dL, Creat: 0.65 mg/dL').
    3. Automatically updates visit.laboratory_reports so Doctor's Desk instantly reflects results.
    4. Marks all ordered Test items as COMPLETED and transitions Visit.status to 'reports_ready'.
    """
    visit = (
        db.query(Visit)
        .options(joinedload(Visit.patient), joinedload(Visit.tests))
        .filter(Visit.id == payload.visit_id)
        .first()
    )

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    if not payload.results and not payload.parameters:
        raise HTTPException(status_code=400, detail="At least one test result is required to finalize report")

    # 1. Fetch or Create LabOrder
    lab_order = db.query(LabOrder).filter(LabOrder.visit_id == visit.id).first()
    if not lab_order:
        lab_order = LabOrder(
            visit_id=visit.id,
            patient_id=visit.patient_id,
            technician_id=current_user.id,
            status="COMPLETED",
        )
        db.add(lab_order)
        db.flush()
    else:
        lab_order.technician_id = current_user.id
        lab_order.status = "COMPLETED"
        db.query(LabResult).filter(LabResult.lab_order_id == lab_order.id).delete()

    # 2. Insert LabResults and calculate bill & summary
    total_amount = 0.0
    abnormal_count = 0
    summary_parts = []

    if payload.parameters:
        for param in payload.parameters:
            is_ab = param.flag in ["LOW", "HIGH", "CRITICAL"]
            if is_ab:
                abnormal_count += 1

            master = db.query(LabTestMaster).filter(LabTestMaster.test_name.ilike(param.parameter_name.strip())).first()
            if not master:
                master = db.query(LabTestMaster).first()

            ref_range = param.reference_range
            if not ref_range and param.reference_range_low is not None and param.reference_range_high is not None:
                ref_range = f"{param.reference_range_low} - {param.reference_range_high}"

            lab_res = LabResult(
                lab_order_id=lab_order.id,
                test_id=master.id if master else 1,
                test_name=param.parameter_name,
                result_value=param.observed_value,
                unit=param.unit,
                normal_range=ref_range,
                is_abnormal=is_ab,
                notes=param.flag,
            )
            db.add(lab_res)

            flag_tag = f" [{param.flag.capitalize()}]" if is_ab else ""
            summary_parts.append(f"{param.parameter_name}: {param.observed_value} {param.unit or ''}{flag_tag}".strip())

    elif payload.results:
        for res in payload.results:
            master_test = db.query(LabTestMaster).filter(LabTestMaster.id == res.test_id).first()
            price = master_test.price if master_test else 0.0
            total_amount += price

            if res.is_abnormal:
                abnormal_count += 1

            lab_result = LabResult(
                lab_order_id=lab_order.id,
                test_id=res.test_id,
                test_name=res.test_name,
                result_value=res.result_value.strip(),
                unit=res.unit or (master_test.unit if master_test else ""),
                normal_range=res.normal_range or (master_test.normal_range if master_test else ""),
                is_abnormal=res.is_abnormal,
                notes=res.notes,
            )
            db.add(lab_result)

            unit_str = f" {res.unit}" if res.unit and res.unit.lower() not in ["profile", "routine"] else ""
            flag_str = " (H)" if res.is_abnormal else ""
            summary_parts.append(f"{res.test_name}: {res.result_value}{unit_str}{flag_str}")

    formatted_summary = payload.result_summary or " • ".join(summary_parts)

    # 3. Update LabOrder details
    lab_order.total_amount = round(total_amount, 2)
    lab_order.summary_results = formatted_summary
    lab_order.completed_at = datetime.utcnow()

    # 4. "Close the Loop" -> Automatically update visit.laboratory_reports & set status to REPORTS_READY
    visit.laboratory_reports = formatted_summary
    visit.status = VisitStatus.REPORTS_READY.value
    visit.updated_at = datetime.utcnow()

    # 5. Mark Test records for this visit as COMPLETED
    if visit.tests:
        for t in visit.tests:
            t.status = TestStatus.COMPLETED.value
            t.results = formatted_summary
            t.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(lab_order)
    db.refresh(visit)

    patient_name = visit.patient.name if visit.patient else f"Patient #{visit.patient_id}"

    return LabOrderFinalizeResponse(
        success=True,
        message=f"Laboratory results finalized successfully for {patient_name}.",
        order_id=lab_order.id,
        visit_id=visit.id,
        patient_name=patient_name,
        summary_results=formatted_summary,
        total_tests_processed=len(payload.parameters or payload.results or []),
        total_abnormal_flags=abnormal_count,
        total_amount=round(total_amount, 2),
        completed_at=lab_order.completed_at,
    )
