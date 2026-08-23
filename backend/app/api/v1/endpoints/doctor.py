import logging
from datetime import datetime, date, time, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole, VisitStatus, TestStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.vitals import Vitals
from app.models.test import Test
from app.schemas.visit import (
    DoctorDashboardKPIs,
    QueuePatientItem,
    DoctorDashboardResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def format_age_sex(patient: Optional[Patient]) -> str:
    """Format age and sex into compact clinical format e.g. '44 Yrs / M'"""
    if not patient:
        return "—"
    
    # Age
    age_str = "—"
    if patient.age_format == "Months" and patient.age_months is not None:
        age_str = f"{patient.age_months} Mos"
    elif patient.age_format == "Days" and patient.age is not None:
        age_str = f"{patient.age} Days"
    elif patient.age_years is not None:
        age_str = f"{patient.age_years} Yrs"
    elif patient.age is not None:
        age_str = f"{patient.age} Yrs"
    
    # Sex
    gender_str = str(patient.gender or "—").strip()
    if gender_str.lower() in ["male", "m"]:
        sex_abbr = "M"
    elif gender_str.lower() in ["female", "f"]:
        sex_abbr = "F"
    else:
        sex_abbr = "O"
    
    return f"{age_str} / {sex_abbr}"


def calculate_waiting_time(
    created_at: Optional[datetime],
    end_time: Optional[datetime] = None,
    status: Optional[str] = None,
) -> tuple[str, int]:
    """Calculate elapsed waiting time string and total minutes from visit created_at safely across timezones."""
    if not created_at:
        return "0 min", 0
    
    is_completed = str(status or "").lower() in ["completed", "consulted", "closed"]
    if is_completed:
        finish_dt = end_time if end_time else created_at
        if finish_dt.tzinfo != created_at.tzinfo:
            finish_dt = finish_dt.replace(tzinfo=created_at.tzinfo)
        diff = finish_dt - created_at
    else:
        if created_at.tzinfo:
            now = datetime.now(created_at.tzinfo)
            diff = now - created_at
        else:
            # Naive created_at: handle both UTC and local server storage without skew
            now_utc = datetime.utcnow()
            now_local = datetime.now()
            diff_utc = (now_utc - created_at).total_seconds()
            diff_local = (now_local - created_at).total_seconds()
            valid_diffs = [d for d in [diff_utc, diff_local] if d >= 0]
            diff_sec = min(valid_diffs) if valid_diffs else max(0, max(diff_utc, diff_local))
            diff = timedelta(seconds=diff_sec)

    total_seconds = max(0, diff.total_seconds())
    total_minutes = int(total_seconds // 60)
    
    if total_minutes < 1:
        return "< 1 min", 0
    elif total_minutes < 60:
        return f"{total_minutes} min", total_minutes
    else:
        hours = total_minutes // 60
        mins = total_minutes % 60
        if mins == 0:
            return f"{hours} hr", total_minutes
        return f"{hours}h {mins}m", total_minutes


def determine_category(visit: Visit, patient: Optional[Patient]) -> str:
    """Determine patient visit category (OPD, Follow-up, Review, Emergency)."""
    if visit.follow_up_date or (visit.follow_up_notes and visit.follow_up_notes.strip()):
        return "Follow-up"
    if visit.chief_complaints and "emergency" in str(visit.chief_complaints).lower():
        return "Emergency"
    if patient and hasattr(patient, "visits") and len(patient.visits) > 1:
        return "Review"
    return "OPD"


@router.get("", response_model=DoctorDashboardResponse)
@router.get("/", response_model=DoctorDashboardResponse)
@router.get("/dashboard", response_model=DoctorDashboardResponse)
async def get_doctor_dashboard(
    consultant: Optional[str] = Query(None, description="Optional consultant name filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN])),
):
    """
    Fetch comprehensive Doctor Dashboard payload including:
    - 6 KPI aggregations (Total Patients, Waiting, Followup, Reports Pending, Not Attended, Completed)
    - High-density Patient Queue table with dynamic waiting time calculation
    Robust zero-fallback guarantees on empty data or DB edge cases.
    """
    try:
        # Match today's visits across timezones and ensure active waiting visits are always visible
        start_today_local = datetime.combine(date.today(), time.min)
        start_today_utc = datetime.combine(datetime.utcnow().date(), time.min)
        earliest_today = min(start_today_local, start_today_utc)
        recent_active_cutoff = datetime.utcnow() - timedelta(days=1)
        
        # Base query for today's visits with eager loading
        query = (
            db.query(Visit)
            .options(
                joinedload(Visit.patient),
                joinedload(Visit.vitals),
                joinedload(Visit.tests),
            )
            .filter(
                or_(
                    Visit.created_at >= earliest_today,
                    and_(
                        Visit.created_at >= recent_active_cutoff,
                        Visit.status.in_([
                            VisitStatus.REGISTERED.value,
                            VisitStatus.VITALS_DONE.value,
                            VisitStatus.IN_CONSULTATION.value,
                        ])
                    )
                )
            )
        )
        
        if consultant and consultant.strip():
            query = query.filter(Visit.consultant_assigned.ilike(f"%{consultant.strip()}%"))
        
        visits = query.order_by(Visit.created_at.asc()).all()
        
        # Calculate KPI Counts with safe 0 fallbacks
        total_patients = len(visits)
        waiting_count = 0
        followup_count = 0
        reports_pending_count = 0
        not_attended_count = 0
        completed_count = 0
        
        queue_items: List[QueuePatientItem] = []
        
        for idx, v in enumerate(visits, start=1):
            status_val = str(v.status or "").lower()
            
            # Check completed / dispensed
            if status_val in [VisitStatus.COMPLETED.value, VisitStatus.CONSULTED.value, VisitStatus.DISPENSED.value]:
                completed_count += 1
            # Check waiting (vitals_done, registered, in_consultation)
            elif status_val in [VisitStatus.VITALS_DONE.value, VisitStatus.REGISTERED.value, VisitStatus.IN_CONSULTATION.value]:
                waiting_count += 1

            # Check not attended (registered, waiting for vitals)
            if status_val == VisitStatus.REGISTERED.value:
                not_attended_count += 1
            
            # Check follow-up
            if v.follow_up_date is not None or (v.follow_up_notes and v.follow_up_notes.strip()):
                followup_count += 1
            
            # Check reports pending (ordered or in-progress tests)
            has_pending_tests = any(
                t.status in [TestStatus.ORDERED.value, TestStatus.IN_PROGRESS.value]
                for t in (v.tests or [])
            )
            if has_pending_tests:
                reports_pending_count += 1
            
            # Dynamic waiting time calculation (frozen if completed)
            waiting_time_str, waiting_mins = calculate_waiting_time(
                v.created_at,
                end_time=v.updated_at,
                status=v.status,
            )
            
            # Build Queue Item
            patient_obj = v.patient
            patient_name = patient_obj.name if patient_obj else f"Patient #{v.patient_id}"
            formatted_pat_id = (
                patient_obj.patient_id
                if (patient_obj and patient_obj.patient_id)
                else f"PAT-{v.patient_id:05d}"
            )
            
            # Extract clinical remarks
            remarks_text = None
            if v.vitals and v.vitals.remarks:
                remarks_text = v.vitals.remarks
            elif v.chief_complaints:
                remarks_text = v.chief_complaints
            
            cat = determine_category(v, patient_obj)
            
            queue_items.append(
                QueuePatientItem(
                    queue_no=idx,
                    visit_id=v.id,
                    visit_number=v.visit_number,
                    patient_id=formatted_pat_id,
                    numeric_patient_id=v.patient_id,
                    patient_name=patient_name,
                    age_sex=format_age_sex(patient_obj),
                    age=getattr(patient_obj, "age", None) or getattr(patient_obj, "age_years", None) if patient_obj else None,
                    gender=patient_obj.gender if patient_obj else None,
                    category=cat,
                    waiting_time=waiting_time_str,
                    waiting_minutes=waiting_mins,
                    remarks=remarks_text,
                    status=v.status,
                    consultant_assigned=v.consultant_assigned,
                    created_at=v.created_at,
                )
            )
        
        kpis = DoctorDashboardKPIs(
            total_patients=total_patients,
            waiting=waiting_count,
            followup=followup_count,
            reports_pending=reports_pending_count,
            not_attended=not_attended_count,
            completed=completed_count,
        )
        
        return DoctorDashboardResponse(
            kpis=kpis,
            queue=queue_items,
            date=date.today().strftime("%d %b %Y"),
        )
        
    except Exception as e:
        logger.error(f"Error fetching doctor dashboard: {e}", exc_info=True)
        # Return graceful zero-state on unexpected database error
        return DoctorDashboardResponse(
            kpis=DoctorDashboardKPIs(),
            queue=[],
            date=date.today().strftime("%d %b %Y"),
        )
