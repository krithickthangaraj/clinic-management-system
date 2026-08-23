import unittest
import asyncio
import json
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus, TestStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.prescription import Prescription, PrescriptionDrug
from app.models.visit_relations import VisitPayment
from app.models.test import Test
from app.models.patient_history import PatientAllergyHistory, PatientPastHistory, PatientSurgicalHistory, PatientFamilyHistory
from app.schemas.consultation import (
    FullPrescriptionPayload,
    FullPrescriptionResponse,
    RXDrugItem,
    PatientHistoryPayload,
    ClinicalAssessmentPayload,
    BillingAndPlanPayload,
)
from app.api.v1.endpoints.prescriptions import save_full_prescription, get_full_prescription


class TestFullPrescriptionFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()

        # Seed Doctor
        self.doctor = User(
            username="dr_jeyagowthaman",
            hashed_password="hashed_pw",
            full_name="Dr. T.S.Jeyagowthaman",
            role=UserRole.DOCTOR.value,
        )
        self.db.add(self.doctor)
        self.db.flush()

        # Seed Patient
        self.patient = Patient(
            name="Vikramaditya Sharma",
            gender="Male",
            age=38,
            age_years=38,
            phone="9876543210",
        )
        self.db.add(self.patient)
        self.db.flush()

        # Seed Visit
        self.visit = Visit(
            visit_number="V-20260822-901",
            patient_id=self.patient.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.IN_CONSULTATION.value,
            consultant_assigned="Dr. T.S.Jeyagowthaman",
        )
        self.db.add(self.visit)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_save_and_retrieve_full_prescription_e2e(self):
        """
        Complete End-to-End Test:
        - Save full prescription via save_full_prescription endpoint handler
        - Verify database records for Prescription, Drugs, History, Ordered Tests, and Billing
        - Retrieve via get_full_prescription endpoint handler
        - Assert full round-trip integrity
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        drug1 = RXDrugItem(
            s_no=1,
            brand_name="Dolo 650",
            drug_name="Paracetamol 650mg",
            dosage="1 Tab",
            frequency="TDS (1-1-1)",
            days=5,
            instructions="After food",
            quantity=15,
        )
        drug2 = RXDrugItem(
            s_no=2,
            brand_name="Augmentin 625",
            drug_name="Amoxicillin + Clavulanic Acid 625mg",
            dosage="1 Tab",
            frequency="BD (1-0-1)",
            days=5,
            instructions="After food",
            quantity=10,
        )

        payload = FullPrescriptionPayload(
            visit_id=self.visit.id,
            patient_id=self.patient.id,
            doctor_id=self.doctor.id,
            consultant_name="Dr. T.S.Jeyagowthaman",
            history=PatientHistoryPayload(
                allergy_history=["Penicillin", "Sulfa drugs"],
                past_history=["Hypertension 2Y"],
                surgical_history=["Appendectomy (2018)"],
                family_history=["Diabetes Mellitus"],
            ),
            assessment=ClinicalAssessmentPayload(
                complaints=[
                    {"complaint": "High grade fever", "duration": "3 Days"},
                    {"complaint": "Severe sore throat", "duration": "2 Days"},
                ],
                diagnosis=["Acute Follicular Tonsillitis", "Pyrexia of Unknown Origin"],
                examination="Throat congested, tonsils enlarged with exudates. Chest clear bilaterally.",
            ),
            medicines=[drug1, drug2],
            plan_and_billing=BillingAndPlanPayload(
                lab_reports_reviewed="CBC reviewed - leukocytosis noted (WBC 14,200).",
                investigations_next_visit=["Complete Blood Count (CBC)", "Throat Swab Culture"],
                procedure="Nebulization",
                referral="ENT Specialist Review",
                advice="Warm saline gargle 3 times a day. Steam inhalation twice daily. Adequate hydration.",
                for_followup=True,
                followup_duration=5,
                followup_unit="Days",
                followup_date="2026-08-28",
                doctor_fee=500.0,
                dressing_fee=150.0,
                procedure_fee=200.0,
                total_amount=850.0,
                payment_mode="Cash",
                payment_status="paid",
            ),
            status_action="completed",
            print_requested=True,
        )

        # 1. Execute Save
        save_response = loop.run_until_complete(
            save_full_prescription(payload=payload, db=self.db, current_user=self.doctor)
        )

        self.assertIsNotNone(save_response)
        self.assertEqual(save_response.status, "completed")
        self.assertEqual(len(save_response.medicines), 2)
        self.assertIsNotNone(save_response.printed_at)

        # 2. Verify Database Records
        saved_prescription = self.db.query(Prescription).filter(Prescription.visit_id == self.visit.id).first()
        self.assertIsNotNone(saved_prescription)

        saved_drugs = self.db.query(PrescriptionDrug).filter(PrescriptionDrug.prescription_id == saved_prescription.id).all()
        self.assertEqual(len(saved_drugs), 2)
        self.assertEqual(saved_drugs[0].brand_name, "Dolo 650")
        self.assertEqual(saved_drugs[1].brand_name, "Augmentin 625")

        saved_tests = self.db.query(Test).filter(Test.visit_id == self.visit.id).all()
        self.assertEqual(len(saved_tests), 2)
        test_names = [t.test_name for t in saved_tests]
        self.assertIn("Complete Blood Count (CBC)", test_names)
        self.assertIn("Throat Swab Culture", test_names)

        saved_payment = self.db.query(VisitPayment).filter(VisitPayment.visit_id == self.visit.id).first()
        self.assertIsNotNone(saved_payment)
        self.assertEqual(saved_payment.total, 850.0)

        # 3. Execute Get Full Prescription
        get_response = loop.run_until_complete(
            get_full_prescription(visit_id=self.visit.id, db=self.db, current_user=self.doctor)
        )

        self.assertIsNotNone(get_response)
        self.assertEqual(get_response.visit_id, self.visit.id)
        self.assertEqual(get_response.status, "completed")
        self.assertEqual(len(get_response.medicines), 2)
        self.assertEqual(get_response.medicines[0].drug_name, "Paracetamol 650mg")
        self.assertEqual(get_response.medicines[0].brand_name, "Dolo 650")
        self.assertEqual(len(get_response.history.allergy_history), 2)
        self.assertEqual(len(get_response.history.past_history), 1)
        self.assertEqual(len(get_response.history.surgical_history), 1)
        self.assertEqual(len(get_response.history.family_history), 1)
        self.assertEqual(len(get_response.plan_and_billing.investigations_next_visit), 2)
        self.assertEqual(get_response.plan_and_billing.total_amount, 850.0)

        loop.close()


if __name__ == "__main__":
    unittest.main()
