import unittest
import asyncio
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.vitals import Vitals
from app.models.prescription import Prescription, PrescriptionDrug
from app.models.visit_relations import VisitPayment
from app.models.test import Test
from app.schemas.patient import PatientRegistrationPayload, PatientCreate
from app.schemas.consultation import (
    FullPrescriptionPayload,
    FullPrescriptionResponse,
    RXDrugItem,
    PatientHistoryPayload,
    ClinicalAssessmentPayload,
    BillingAndPlanPayload,
)
from app.services.patient_service import register_patient_with_visit
from app.api.v1.endpoints.doctor import get_doctor_dashboard
from app.api.v1.endpoints.prescriptions import save_full_prescription, get_full_prescription
from app.api.v1.endpoints.visits import get_reception_today


class TestTwoPatientRegistrationToPrescriptionFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

        # 1. Doctor
        self.doctor = self.db.query(User).filter_by(username="dr_jeyagowthaman").first()
        if not self.doctor:
            self.doctor = User(
                username="dr_jeyagowthaman",
                hashed_password="hashed_pw",
                full_name="Dr. T.S.Jeyagowthaman",
                role=UserRole.DOCTOR.value,
            )
            self.db.add(self.doctor)

        # 2. Receptionist
        self.receptionist = self.db.query(User).filter_by(username="reception").first()
        if not self.receptionist:
            self.receptionist = User(
                username="reception",
                hashed_password="hashed_pw",
                full_name="Staff Nurse Priya",
                role=UserRole.RECEPTION.value,
            )
            self.db.add(self.receptionist)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_reception_and_doctor_queue_synchronization(self):
        """
        Verify that patients registered at reception immediately appear in:
        1. Reception Today Queue (/api/v1/visits/reception-today)
        2. Doctor Dashboard Queue (/api/v1/doctor/dashboard)
        with identical count and patient data.
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # Register 4 patients in waiting state
        for i in range(1, 5):
            p_data = PatientCreate(
                name=f"Sync Patient #{i}",
                phone=f"987654310{i}",
                gender="Male" if i % 2 == 1 else "Female",
                age_years=30 + i,
                city="Chennai",
            )
            v_data = {
                "weight_kg": 65.0 + i,
                "height_cm": 170.0,
                "bp_systolic": 120,
                "bp_diastolic": 80,
                "pulse_bpm": 72,
                "spo2": 99,
                "temp_f": 98.6,
            }
            register_patient_with_visit(
                db=self.db,
                patient_data=p_data,
                vitals_data=v_data,
                consultant_assigned="Dr. T.S.Jeyagowthaman",
            )

        # 1. Fetch Reception Queue
        reception_visits = loop.run_until_complete(
            get_reception_today(db=self.db, current_user=self.receptionist)
        )
        self.assertGreaterEqual(len(reception_visits), 4)

        # 2. Fetch Doctor Desk Dashboard
        doctor_dashboard = loop.run_until_complete(
            get_doctor_dashboard(consultant="", db=self.db, current_user=self.doctor)
        )
        self.assertGreaterEqual(len(doctor_dashboard.queue), 4)
        self.assertGreaterEqual(doctor_dashboard.kpis.waiting, 4)

        # Ensure all 4 newly registered patients are in both queues
        reception_patient_names = {v.patient_name for v in reception_visits}
        doctor_patient_names = {q.patient_name for q in doctor_dashboard.queue}
        for i in range(1, 5):
            self.assertIn(f"Sync Patient #{i}", reception_patient_names)
            self.assertIn(f"Sync Patient #{i}", doctor_patient_names)

        loop.close()

    def test_complete_two_patient_lifecycle_registration_to_prescription(self):
        """
        End-to-End Lifecycle Verification:
        1. Register Patient #1 (Karthik Raja, 32M) with vitals.
        2. Register Patient #2 (Ananya Sundaram, 28F) with vitals.
        3. Query Doctor Dashboard / Queue -> Assert both appear in waiting queue.
        4. Complete Consultation & Prescription for Patient #1 -> Assert status completed.
        5. Complete Consultation & Print Prescription for Patient #2 -> Assert status completed.
        6. Fetch full prescription for both -> Assert complete clinical & RX data roundtrip.
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # -------------------------------------------------------------
        # STEP 1: Register Patient #1 (Karthik Raja)
        # -------------------------------------------------------------
        p1_data = PatientCreate(
            name="Karthik Raja",
            phone="9876500001",
            gender="Male",
            age_years=32,
            blood_group="O+",
            city="Chennai",
        )
        p1_vitals = {
            "weight_kg": 72.5,
            "height_cm": 175.0,
            "bp_systolic": 120,
            "bp_diastolic": 80,
            "pulse_bpm": 74,
            "spo2": 99,
            "temp_f": 98.6,
            "grbs": 110,
        }
        pat1, visit1, vitals1 = register_patient_with_visit(
            db=self.db,
            patient_data=p1_data,
            vitals_data=p1_vitals,
            consultant_assigned="Dr. T.S.Jeyagowthaman",
        )

        self.assertIsNotNone(pat1)
        self.assertIsNotNone(visit1)
        self.assertTrue(pat1.patient_id.startswith("PAT-"))
        self.assertTrue(visit1.visit_number.startswith("V-"))
        self.assertEqual(visit1.status, VisitStatus.VITALS_DONE.value)

        # -------------------------------------------------------------
        # STEP 2: Register Patient #2 (Ananya Sundaram)
        # -------------------------------------------------------------
        p2_data = PatientCreate(
            name="Ananya Sundaram",
            phone="9876500002",
            gender="Female",
            age_years=28,
            blood_group="B+",
            city="Chennai",
        )
        p2_vitals = {
            "weight_kg": 58.0,
            "height_cm": 162.0,
            "bp_systolic": 110,
            "bp_diastolic": 70,
            "pulse_bpm": 80,
            "spo2": 98,
            "temp_f": 101.2,
            "grbs": 95,
        }
        pat2, visit2, vitals2 = register_patient_with_visit(
            db=self.db,
            patient_data=p2_data,
            vitals_data=p2_vitals,
            consultant_assigned="Dr. T.S.Jeyagowthaman",
        )

        self.assertIsNotNone(pat2)
        self.assertIsNotNone(visit2)
        self.assertTrue(pat2.patient_id.startswith("PAT-"))
        self.assertTrue(visit2.visit_number.startswith("V-"))

        # -------------------------------------------------------------
        # STEP 3: Verify Doctor Dashboard / Queue contains both patients
        # -------------------------------------------------------------
        dashboard_res = loop.run_until_complete(
            get_doctor_dashboard(consultant="Dr. T.S.Jeyagowthaman", db=self.db, current_user=self.doctor)
        )

        self.assertIsNotNone(dashboard_res)
        self.assertGreaterEqual(dashboard_res.kpis.total_patients, 2)
        self.assertGreaterEqual(dashboard_res.kpis.waiting, 2)

        queue_names = [q.patient_name for q in dashboard_res.queue]
        self.assertIn("Karthik Raja", queue_names)
        self.assertIn("Ananya Sundaram", queue_names)

        # -------------------------------------------------------------
        # STEP 4: Complete Consultation & Prescription for Patient #1
        # -------------------------------------------------------------
        p1_prescription = FullPrescriptionPayload(
            visit_id=visit1.id,
            patient_id=pat1.id,
            doctor_id=self.doctor.id,
            consultant_name="Dr. T.S.Jeyagowthaman",
            history=PatientHistoryPayload(
                past_history=["Hypertension 1Y"],
                allergy_history=["Dust allergy"],
            ),
            assessment=ClinicalAssessmentPayload(
                complaints=[{"complaint": "Persistent dry cough", "duration": "4 Days"}],
                diagnosis=["Acute Upper Respiratory Infection"],
                examination="Chest clear, pharynx mild congestion.",
            ),
            medicines=[
                RXDrugItem(
                    s_no=1,
                    brand_name="Ascoril D",
                    drug_name="Dextromethorphan + Chlorpheniramine",
                    dosage="10 ml",
                    frequency="TDS (1-1-1)",
                    days=5,
                    instructions="After food",
                    quantity=1,
                ),
                RXDrugItem(
                    s_no=2,
                    brand_name="Montek LC",
                    drug_name="Montelukast + Levocetirizine",
                    dosage="1 Tab",
                    frequency="HS (0-0-1)",
                    days=5,
                    instructions="At bedtime",
                    quantity=5,
                ),
            ],
            plan_and_billing=BillingAndPlanPayload(
                advice="Avoid cold drinks, drink warm water.",
                followup_date="2026-08-30",
                for_followup=True,
                doctor_fee=400.0,
                total_amount=400.0,
                payment_mode="Cash",
                payment_status="paid",
            ),
            status_action="completed",
            print_requested=False,
        )

        p1_save_res = loop.run_until_complete(
            save_full_prescription(payload=p1_prescription, db=self.db, current_user=self.doctor)
        )
        self.assertEqual(p1_save_res.status, "completed")
        self.assertEqual(len(p1_save_res.medicines), 2)

        # -------------------------------------------------------------
        # STEP 5: Complete Consultation & Print Prescription for Patient #2
        # -------------------------------------------------------------
        p2_prescription = FullPrescriptionPayload(
            visit_id=visit2.id,
            patient_id=pat2.id,
            doctor_id=self.doctor.id,
            consultant_name="Dr. T.S.Jeyagowthaman",
            history=PatientHistoryPayload(
                allergy_history=["Penicillin"],
                family_history=["Diabetes Mellitus Type 2"],
            ),
            assessment=ClinicalAssessmentPayload(
                complaints=[{"complaint": "Acute viral fever with body aches", "duration": "2 Days"}],
                diagnosis=["Acute Viral Pharyngitis", "Pyrexia"],
                examination="Tonsils mildly enlarged. Temperature 101.2°F.",
            ),
            medicines=[
                RXDrugItem(
                    s_no=1,
                    brand_name="Dolo 650",
                    drug_name="Paracetamol 650mg",
                    dosage="1 Tab",
                    frequency="TDS (1-1-1)",
                    days=3,
                    instructions="After food",
                    quantity=9,
                ),
                RXDrugItem(
                    s_no=2,
                    brand_name="Azithral 500",
                    drug_name="Azithromycin 500mg",
                    dosage="1 Tab",
                    frequency="OD (1-0-0)",
                    days=3,
                    instructions="1 hour before food",
                    quantity=3,
                ),
            ],
            plan_and_billing=BillingAndPlanPayload(
                investigations_next_visit=["CBC if fever persists"],
                advice="Adequate bed rest, light diet, sponge if temp > 101°F.",
                followup_date="2026-08-27",
                for_followup=True,
                doctor_fee=500.0,
                dressing_fee=0.0,
                total_amount=500.0,
                payment_mode="UPI",
                payment_status="paid",
            ),
            status_action="completed",
            print_requested=True,
        )

        p2_save_res = loop.run_until_complete(
            save_full_prescription(payload=p2_prescription, db=self.db, current_user=self.doctor)
        )
        self.assertEqual(p2_save_res.status, "completed")
        self.assertIsNotNone(p2_save_res.printed_at)
        self.assertEqual(len(p2_save_res.medicines), 2)

        # -------------------------------------------------------------
        # STEP 6: Re-fetch full prescriptions from DB
        # -------------------------------------------------------------
        p1_retrieved = loop.run_until_complete(
            get_full_prescription(visit_id=visit1.id, db=self.db, current_user=self.doctor)
        )
        self.assertEqual(p1_retrieved.visit_id, visit1.id)
        self.assertEqual(p1_retrieved.status, "completed")
        self.assertEqual(len(p1_retrieved.medicines), 2)
        self.assertEqual(p1_retrieved.medicines[0].drug_name, "Dextromethorphan + Chlorpheniramine")
        self.assertEqual(p1_retrieved.medicines[1].brand_name, "Montek LC")
        self.assertEqual(p1_retrieved.plan_and_billing.total_amount, 400.0)

        p2_retrieved = loop.run_until_complete(
            get_full_prescription(visit_id=visit2.id, db=self.db, current_user=self.doctor)
        )
        self.assertEqual(p2_retrieved.visit_id, visit2.id)
        self.assertEqual(p2_retrieved.status, "completed")
        self.assertIsNotNone(p2_retrieved.printed_at)
        self.assertEqual(len(p2_retrieved.medicines), 2)
        self.assertEqual(p2_retrieved.medicines[0].brand_name, "Dolo 650")
        self.assertEqual(p2_retrieved.medicines[1].brand_name, "Azithral 500")
        self.assertEqual(p2_retrieved.history.allergy_history, ["Penicillin"])
        self.assertEqual(p2_retrieved.plan_and_billing.total_amount, 500.0)

        loop.close()


if __name__ == "__main__":
    unittest.main()
