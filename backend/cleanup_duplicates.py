import logging
from app.core.database import SessionLocal
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.vitals import Vitals
from app.models.prescription import Prescription
from app.models.test import Test
from app.models.patient_history import (
    PatientPastHistory,
    PatientSurgicalHistory,
    PatientFamilyHistory,
    PatientAllergyHistory,
)
from app.models.visit_relations import VisitComplaint, VisitDiagnosis, VisitPayment
from app.models.pharmacy import PharmacyDispenseLog

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def deduplicate_patients():
    db = SessionLocal()
    try:
        patients = db.query(Patient).order_by(Patient.id.asc()).all()
        print(f"Initial Total Patients in DB: {len(patients)}")

        # Group by normalized (name.lower(), phone)
        groups = {}
        for p in patients:
            norm_name = (p.name or "").strip().lower()
            norm_phone = (p.phone or "").strip()
            key = (norm_name, norm_phone)
            if key not in groups:
                groups[key] = []
            groups[key].append(p)

        deleted_count = 0
        merged_groups = 0

        for key, p_list in groups.items():
            if len(p_list) > 1:
                merged_groups += 1
                # Primary patient to keep: lowest ID
                primary = p_list[0]
                duplicates = p_list[1:]
                dup_ids = [d.id for d in duplicates]
                print(f"\nProcessing Duplicate Group '{primary.name}' (Phone: {primary.phone}):")
                print(f" - Keeping Primary ID: {primary.id} ({primary.patient_id})")
                print(f" - Merging & Removing Duplicate IDs: {dup_ids}")

                for dup in duplicates:
                    dup_id = dup.id
                    
                    # 1. Reassign Visits to primary patient
                    visits = db.query(Visit).filter(Visit.patient_id == dup_id).all()
                    for v in visits:
                        v.patient_id = primary.id
                        print(f"   Reassigned Visit #{v.id} from Pat #{dup_id} -> Pat #{primary.id}")

                    # 2. Reassign History Tables if any
                    db.query(PatientPastHistory).filter(PatientPastHistory.patient_id == dup_id).update({"patient_id": primary.id})
                    db.query(PatientSurgicalHistory).filter(PatientSurgicalHistory.patient_id == dup_id).update({"patient_id": primary.id})
                    db.query(PatientFamilyHistory).filter(PatientFamilyHistory.patient_id == dup_id).update({"patient_id": primary.id})
                    db.query(PatientAllergyHistory).filter(PatientAllergyHistory.patient_id == dup_id).update({"patient_id": primary.id})

                    # 3. Delete Duplicate Patient
                    db.delete(dup)
                    deleted_count += 1

        db.commit()
        print(f"\n✅ Deduplication Complete! Merged {merged_groups} groups, safely removed {deleted_count} duplicate records.")

        remaining = db.query(Patient).order_by(Patient.id.asc()).all()
        print(f"Remaining Clean Patients in DB: {len(remaining)}")
        for p in remaining:
            print(f" - ID: {p.id:2d} | Code: {p.patient_id:10s} | Name: {p.name:25s} | Phone: {p.phone}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during deduplication: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    deduplicate_patients()
