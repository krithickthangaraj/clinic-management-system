import unittest
import asyncio
from datetime import datetime, date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus, TestStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.test import Test
from app.models.lab import LabTestMaster, LabOrder, LabResult
from app.schemas.patient import PatientCreate
from app.schemas.consultation import (
    FullPrescriptionPayload,
    ClinicalAssessmentPayload,
    BillingAndPlanPayload,
    RXDrugItem,
)
from app.schemas.lab import LabOrderFinalizeRequest, LabResultItem
from seed_lab_master import LAB_TESTS_SEEDS
from app.services.patient_service import register_patient_with_visit
from app.api.v1.endpoints.doctor import get_doctor_dashboard
from app.api.v1.endpoints.prescriptions import save_full_prescription, get_full_prescription
from app.api.v1.endpoints.lab import get_lab_queue, get_lab_order_details, finalize_lab_order


class TestAsyncLabWorkflow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # 100% Isolated in-memory SQLite database
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

        # Seed Users (Doctor, Lab Tech, Receptionist)
        self.doctor = self.db.query(User).filter_by(username="dr_jeyagowthaman_async").first()
        if not self.doctor:
            self.doctor = User(
                username="dr_jeyagowthaman_async",
                hashed_password="pw",
                full_name="Dr. T.S.Jeyagowthaman",
                role=UserRole.DOCTOR.value,
            )
            self.db.add(self.doctor)

        self.tech = self.db.query(User).filter_by(username="tech_anita_async").first()
        if not self.tech:
            self.tech = User(
                username="tech_anita_async",
                hashed_password="pw",
                full_name="Lab Tech Anita",
                role=UserRole.LAB.value,
            )
            self.db.add(self.tech)

        # Seed Master Lab Tests if empty
        if self.db.query(LabTestMaster).count() == 0:
            for item in LAB_TESTS_SEEDS:
                self.db.add(LabTestMaster(**item))

        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_complete_async_doctor_lab_multi_actor_journey(self):
        """
        Exhaustive E2E Multi-Actor Async Flow:
        1. Reception registers Patient A & Patient B.
        2. Doctor starts consult with Patient A, orders tests, puts on Hold (REPORTS_PENDING).
        3. Doctor unblocked -> Consults & completes Patient B.
        4. Lab Tech processes Patient A tests, enters results & finalizes (REPORTS_READY).
        5. Doctor receives notification badge, resumes Patient A, sees results, prints -> COMPLETED.
        """

        # =========================================================================
        # STEP 1 (Reception): Register Patient A & Patient B
        # =========================================================================
        pat_a_payload = PatientCreate(
            full_name="Ramesh Sundaram",
            phone_number="9840199001",
            gender="Male",
            age=45,
            age_format="Years",
        )
        patient_a, visit_a, _ = register_patient_with_visit(
            db=self.db,
            patient_data=pat_a_payload,
            vitals_data={
                "weight_kg": 72.0,
                "height_cm": 170.0,
                "blood_pressure": "130/80",
                "temperature_f": 98.6,
                "spo2_percent": 98,
                "pulse_rate_bpm": 74,
                "grbs_mg_dl": 110,
            },
            consultant_assigned="Dr. T.S.Jeyagowthaman",
        )

        pat_b_payload = PatientCreate(
            full_name="Priya Balan",
            phone_number="9840199002",
            gender="Female",
            age=32,
            age_format="Years",
        )
        patient_b, visit_b, _ = register_patient_with_visit(
            db=self.db,
            patient_data=pat_b_payload,
            vitals_data={
                "weight_kg": 58.0,
                "height_cm": 160.0,
                "blood_pressure": "110/70",
                "temperature_f": 99.0,
                "spo2_percent": 99,
                "pulse_rate_bpm": 80,
                "grbs_mg_dl": 95,
            },
            consultant_assigned="Dr. T.S.Jeyagowthaman",
        )

        self.assertIsNotNone(visit_a)
        self.assertIsNotNone(visit_b)
        self.assertEqual(visit_a.status, VisitStatus.VITALS_DONE.value)
        self.assertEqual(visit_b.status, VisitStatus.VITALS_DONE.value)

        # =========================================================================
        # STEP 2 (Doctor Desk): Consult Patient A, Order Lab Test, Put on Hold
        # =========================================================================
        prescription_a_payload = FullPrescriptionPayload(
            visit_id=visit_a.id,
            patient_id=patient_a.id,
            consultant_name="Dr. T.S.Jeyagowthaman",
            assessment=ClinicalAssessmentPayload(
                complaints=["Fatigue and generalized body ache for 1 week"],
                diagnosis=["Suspected Microcytic Anemia"],
            ),
            plan_and_billing=BillingAndPlanPayload(
                investigations_next_visit=["Hemoglobin (Hb)", "Serum Ferritin"],
                doctor_fee=300.0,
                total_amount=300.0,
            ),
            medicines=[],  # No medicines required yet when sending to lab
            status_action="send_to_lab",  # Doctor puts on hold
        )

        res_a = asyncio.run(
            save_full_prescription(payload=prescription_a_payload, db=self.db, current_user=self.doctor)
        )

        # Assert Patient A state
        self.db.refresh(visit_a)
        self.assertEqual(visit_a.status, VisitStatus.REPORTS_PENDING.value)
        self.assertEqual(res_a.status, VisitStatus.REPORTS_PENDING.value)

        # Assert Diagnostic Test entities created
        tests_in_db = self.db.query(Test).filter_by(visit_id=visit_a.id).all()
        self.assertEqual(len(tests_in_db), 2)
        self.assertTrue(all(t.status == TestStatus.ORDERED.value for t in tests_in_db))

        # Assert Patient A appears in Lab Queue
        lab_queue = asyncio.run(
            get_lab_queue(db=self.db, current_user=self.tech)
        )
        found_in_lab = next((q for q in lab_queue if q.visit_id == visit_a.id), None)
        self.assertIsNotNone(found_in_lab, "Patient A must appear in Lab Technician Queue")
        self.assertIn("Hemoglobin (Hb)", found_in_lab.prescribed_tests)

        # =========================================================================
        # STEP 3 (Doctor Desk): Doctor is Unblocked -> Consults Patient B
        # =========================================================================
        prescription_b_payload = FullPrescriptionPayload(
            visit_id=visit_b.id,
            patient_id=patient_b.id,
            consultant_name="Dr. T.S.Jeyagowthaman",
            assessment=ClinicalAssessmentPayload(
                complaints=["Mild viral pyrexia and headache"],
                diagnosis=["Acute Viral Pharyngitis"],
            ),
            medicines=[
                RXDrugItem(
                    s_no=1,
                    brand_name="Dolo 650 Tab.",
                    drug_name="Paracetamol",
                    dosage="1 Tab",
                    frequency="TDS (1-1-1)",
                    days=3,
                    instructions="After food",
                    quantity=3,
                )
            ],
            plan_and_billing=BillingAndPlanPayload(
                doctor_fee=300.0,
                total_amount=300.0,
            ),
            status_action="completed",
            print_requested=True,
        )

        res_b = asyncio.run(
            save_full_prescription(payload=prescription_b_payload, db=self.db, current_user=self.doctor)
        )

        self.db.refresh(visit_b)
        self.assertEqual(visit_b.status, VisitStatus.COMPLETED.value)
        self.assertEqual(res_b.status, VisitStatus.COMPLETED.value)

        # =========================================================================
        # STEP 4 (Lab Technician): Enters Results & Finalizes Patient A
        # =========================================================================
        hb_master = self.db.query(LabTestMaster).filter_by(test_name="Hemoglobin (Hb)").first()
        self.assertIsNotNone(hb_master)

        finalize_payload = LabOrderFinalizeRequest(
            visit_id=visit_a.id,
            results=[
                LabResultItem(
                    test_id=hb_master.id,
                    test_name="Hemoglobin (Hb)",
                    result_value="10.8",
                    unit="g/dL",
                    normal_range="13.0 - 17.0",
                    is_abnormal=True,
                    notes="Mild anemia",
                )
            ],
            payment_mode="Cash",
        )

        lab_res = asyncio.run(
            finalize_lab_order(payload=finalize_payload, db=self.db, current_user=self.tech)
        )
        self.assertTrue(lab_res.success)

        # Assert Visit A transitioned to REPORTS_READY
        self.db.refresh(visit_a)
        self.assertEqual(visit_a.status, VisitStatus.REPORTS_READY.value)
        self.assertIsNotNone(visit_a.laboratory_reports)
        self.assertIn("Hemoglobin (Hb): 10.8 g/dL (H)", visit_a.laboratory_reports)

        # Assert Doctor Dashboard shows Notification Flag
        doc_dash = asyncio.run(
            get_doctor_dashboard(consultant=None, db=self.db, current_user=self.doctor)
        )
        dash_item_a = next((q for q in doc_dash.queue if q.visit_id == visit_a.id), None)
        self.assertIsNotNone(dash_item_a)
        self.assertTrue(dash_item_a.lab_results_ready, "lab_results_ready flag must be TRUE on Doctor Dashboard")
        self.assertEqual(dash_item_a.status, VisitStatus.REPORTS_READY.value)

        # =========================================================================
        # STEP 5 (Doctor Desk): Resumes Patient A, Reviews Lab, Adds RX & Completes
        # =========================================================================
        # 1. Doctor fetches full prescription data for Patient A
        loaded_a = asyncio.run(
            get_full_prescription(visit_id=visit_a.id, db=self.db, current_user=self.doctor)
        )
        self.assertEqual(loaded_a.assessment.diagnosis, ["Suspected Microcytic Anemia"])
        self.assertEqual(loaded_a.assessment.complaints, ["Fatigue and generalized body ache for 1 week"])

        # 2. Doctor prescribes Iron Supplements & completes visit
        final_rx_a_payload = FullPrescriptionPayload(
            visit_id=visit_a.id,
            patient_id=patient_a.id,
            consultant_name="Dr. T.S.Jeyagowthaman",
            history=loaded_a.history,
            assessment=loaded_a.assessment,
            medicines=[
                RXDrugItem(
                    s_no=1,
                    brand_name="Autrin Cap.",
                    drug_name="Ferrous Fumarate + Folic Acid",
                    dosage="1 Cap",
                    frequency="OD (0-1-0)",
                    days=15,
                    instructions="After lunch",
                    quantity=15,
                )
            ],
            plan_and_billing=BillingAndPlanPayload(
                lab_reports_reviewed=visit_a.laboratory_reports,
                doctor_fee=300.0,
                total_amount=300.0,
            ),
            status_action="completed",
            print_requested=True,
        )

        final_res_a = asyncio.run(
            save_full_prescription(payload=final_rx_a_payload, db=self.db, current_user=self.doctor)
        )

        # Final Assertions
        self.db.refresh(visit_a)
        self.assertEqual(visit_a.status, VisitStatus.COMPLETED.value)
        self.assertEqual(final_res_a.status, VisitStatus.COMPLETED.value)
        self.assertEqual(len(final_res_a.medicines), 1)
        self.assertEqual(final_res_a.medicines[0].drug_name, "Ferrous Fumarate + Folic Acid")


if __name__ == "__main__":
    unittest.main()
