import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.patient_history import PatientAllergyHistory
from app.schemas.patient import PatientCreate
from app.schemas.vitals import VitalsCreate
from app.schemas.consultation import (
    FullPrescriptionPayload,
    RXDrugItem,
    PatientHistoryPayload,
)
from app.services.patient_service import register_patient_with_visit
from app.api.v1.endpoints.prescriptions import save_full_prescription
from app.api.v1.endpoints.vitals import create_vitals


class TestClinicalSafetyPack(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

        # Seed Doctor
        self.doctor = User(
            username="doc_jeyagowthaman",
            hashed_password="hash",
            full_name="Dr. T.S.Jeyagowthaman",
            role=UserRole.DOCTOR.value,
        )
        self.session.add(self.doctor)

        # Seed Receptionist
        self.receptionist = User(
            username="reception_user",
            hashed_password="hash",
            full_name="Reception Staff",
            role=UserRole.RECEPTION.value,
        )
        self.session.add(self.receptionist)
        self.session.commit()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine)

    async def test_allergy_history_preservation_on_empty_prescription_save(self):
        """CRITICAL SAFETY 1: Verify saving a prescription with empty allergy history NEVER erases recorded allergies."""
        # 1. Create Patient with Penicillin & Sulfa allergy
        patient = Patient(
            name="Ramesh Kumar",
            gender="Male",
            age=45,
            phone="9876500001",
            patient_id="PAT-90001",
        )
        self.session.add(patient)
        self.session.flush()

        allergy1 = PatientAllergyHistory(patient_id=patient.id, value="Penicillin")
        allergy2 = PatientAllergyHistory(patient_id=patient.id, value="Sulfa Drugs")
        self.session.add_all([allergy1, allergy2])

        visit = Visit(
            visit_number="V-20260829-901",
            patient_id=patient.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.IN_CONSULTATION.value,
            consultant_assigned="Dr. T.S.Jeyagowthaman",
        )
        self.session.add(visit)
        self.session.commit()

        # Verify initial allergies exist
        initial_allergies = (
            self.session.query(PatientAllergyHistory)
            .filter(PatientAllergyHistory.patient_id == patient.id)
            .all()
        )
        self.assertEqual(len(initial_allergies), 2)

        # 2. Save follow-up prescription with EMPTY allergy array
        payload = FullPrescriptionPayload(
            visit_id=visit.id,
            medicines=[
                RXDrugItem(drug_name="Paracetamol 500mg", dosage="1 Tab", frequency="TDS (1-1-1)", number_of_days=3)
            ],
            history=PatientHistoryPayload(allergy_history=[]),  # Empty array
            status_action="completed",
        )

        res = await save_full_prescription(
            payload=payload,
            db=self.session,
            current_user=self.doctor,
        )
        self.assertEqual(res.status, "completed")

        # 3. CRITICAL VERIFICATION: Penicillin & Sulfa allergies MUST still exist!
        rechecked = (
            self.session.query(PatientAllergyHistory)
            .filter(PatientAllergyHistory.patient_id == patient.id)
            .all()
        )
        self.assertEqual(len(rechecked), 2)
        allergy_values = [a.value for a in rechecked]
        self.assertIn("Penicillin", allergy_values)
        self.assertIn("Sulfa Drugs", allergy_values)

    async def test_vitals_state_lock_guard_in_consultation(self):
        """CRITICAL SAFETY 2: Ensure recording/updating vitals during active consult does NOT revert IN_CONSULTATION to vitals_done."""
        # 1. Patient in active consultation
        patient = Patient(name="Suresh Raina", gender="Male", age=36, phone="9876500002")
        self.session.add(patient)
        self.session.flush()

        visit = Visit(
            visit_number="V-20260829-902",
            patient_id=patient.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.IN_CONSULTATION.value,
        )
        self.session.add(visit)
        self.session.commit()

        # 2. Doctor re-measures BP during consultation
        vitals_payload = VitalsCreate(
            visit_id=visit.id,
            bp_systolic=130,
            bp_diastolic=85,
            blood_pressure="130/85",
            pulse_rate=76,
        )

        vitals_res = await create_vitals(
            vitals_data=vitals_payload,
            db=self.session,
            current_user=self.doctor,
        )
        self.assertEqual(vitals_res.blood_pressure, "130/85")

        # 3. CRITICAL VERIFICATION: Visit status MUST remain IN_CONSULTATION
        self.session.refresh(visit)
        self.assertEqual(visit.status, VisitStatus.IN_CONSULTATION.value)

    def test_family_phone_sharing_creates_distinct_uhids(self):
        """CRITICAL SAFETY 3: Ensure parent and child sharing the same phone receive distinct UHIDs without data overwrite."""
        # 1. Register Parent (Kavitha)
        parent_data = PatientCreate(
            name="Kavitha Sundaram",
            full_name="Kavitha Sundaram",
            phone="9840199999",
            gender="Female",
            age_years=36,
        )
        parent, visit1, _ = register_patient_with_visit(
            db=self.session,
            patient_data=parent_data,
        )
        self.session.commit()

        # 2. Register Child (Master Arjun) with same phone
        child_data = PatientCreate(
            name="Master Arjun Sundaram",
            full_name="Master Arjun Sundaram",
            phone="9840199999",
            gender="Male",
            age_years=6,
        )
        child, visit2, _ = register_patient_with_visit(
            db=self.session,
            patient_data=child_data,
        )
        self.session.commit()

        # 3. CRITICAL VERIFICATION:
        # Both must exist independently, have distinct IDs and distinct UHIDs
        self.assertNotEqual(parent.id, child.id)
        self.assertNotEqual(parent.patient_id, child.patient_id)
        self.assertEqual(parent.name, "Kavitha Sundaram")
        self.assertEqual(child.name, "Master Arjun Sundaram")
        self.assertEqual(parent.phone, "9840199999")
        self.assertEqual(child.phone, "9840199999")


if __name__ == "__main__":
    unittest.main()
