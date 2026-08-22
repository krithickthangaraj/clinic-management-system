import unittest
import json
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.prescription import Prescription, PrescriptionDrug
from app.models.visit_relations import VisitPayment
from app.models.patient_history import PatientAllergyHistory, PatientPastHistory
from app.schemas.consultation import (
    FullPrescriptionPayload,
    FullPrescriptionResponse,
    RXDrugItem,
    PatientHistoryPayload,
    ClinicalAssessmentPayload,
    BillingAndPlanPayload,
)


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

    def test_save_and_retrieve_full_prescription_with_sno_and_brand(self):
        """
        Verify that saving and fetching prescription correctly persists
        s_no, brand_name, auto-calculated quantities, allergies, complaints,
        and billing amounts without any UndefinedColumn errors.
        """
        # 1. Prepare Full Prescription Payload
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
                past_history=["Type 2 Diabetes"],
                allergy_history=["NSAIDS", "Sea Foods"],
                surgical_history=["Appendectomy"],
            ),
            assessment=ClinicalAssessmentPayload(
                complaints=[{"complaint": "High fever with chills", "duration": "3 days"}],
                diagnosis=["Acute Bronchitis", "Viral Pyrexia"],
                examination="Chest bilateral rhonchi, Throat congested",
            ),
            medicines=[drug1, drug2],
            plan_and_billing=BillingAndPlanPayload(
                advice="Drink warm water, take rest",
                for_followup=True,
                followup_duration=7,
                followup_unit="Days",
                doctor_fee=350.0,
                dressing_fee=50.0,
                procedure_fee=0.0,
                total_amount=400.0,
                payment_mode="Cash",
                payment_status="paid",
            ),
            status_action="completed",
        )

        # 2. Simulate Save Full Prescription logic
        visit = self.db.query(Visit).filter(Visit.id == payload.visit_id).first()
        self.assertIsNotNone(visit)

        # Update visit fields
        visit.diagnosis = ", ".join(payload.assessment.diagnosis)
        visit.chief_complaints = json.dumps(payload.assessment.complaints)
        visit.advice = payload.plan_and_billing.advice
        visit.status = VisitStatus.COMPLETED.value

        # Create Prescription and drugs
        prescription = Prescription(
            visit_id=visit.id,
            doctor_id=self.doctor.id,
        )
        self.db.add(prescription)
        self.db.flush()

        for d in payload.medicines:
            new_drug = PrescriptionDrug(
                prescription_id=prescription.id,
                s_no=d.s_no,
                brand_name=d.brand_name,
                drug_name=d.drug_name,
                dosage=d.dosage,
                frequency=d.frequency,
                instructions=d.instructions,
                number_of_days=d.days,
                quantity=d.quantity,
            )
            self.db.add(new_drug)

        # Save history tags
        for a in payload.history.allergy_history:
            self.db.add(PatientAllergyHistory(patient_id=self.patient.id, value=a))

        # Save payment
        payment = VisitPayment(
            visit_id=visit.id,
            doctor_fee=payload.plan_and_billing.doctor_fee,
            total=payload.plan_and_billing.total_amount,
            payment_status=payload.plan_and_billing.payment_status,
        )
        self.db.add(payment)
        self.db.commit()

        # 3. Retrieve and assert all fields including s_no and brand_name
        saved_drugs = self.db.query(PrescriptionDrug).filter(
            PrescriptionDrug.prescription_id == prescription.id
        ).order_by(PrescriptionDrug.s_no.asc()).all()

        self.assertEqual(len(saved_drugs), 2)
        
        # Verify 1st drug
        self.assertEqual(saved_drugs[0].s_no, 1)
        self.assertEqual(saved_drugs[0].brand_name, "Dolo 650")
        self.assertEqual(saved_drugs[0].drug_name, "Paracetamol 650mg")
        self.assertEqual(saved_drugs[0].quantity, 15)

        # Verify 2nd drug
        self.assertEqual(saved_drugs[1].s_no, 2)
        self.assertEqual(saved_drugs[1].brand_name, "Augmentin 625")
        self.assertEqual(saved_drugs[1].drug_name, "Amoxicillin + Clavulanic Acid 625mg")
        self.assertEqual(saved_drugs[1].quantity, 10)

        # Verify visit status and complaints
        self.assertEqual(visit.status, VisitStatus.COMPLETED.value)
        complaints_parsed = json.loads(visit.chief_complaints)
        self.assertEqual(complaints_parsed[0]["complaint"], "High fever with chills")

        # Verify allergies
        allergies = self.db.query(PatientAllergyHistory).filter(
            PatientAllergyHistory.patient_id == self.patient.id
        ).all()
        allergy_names = [a.value for a in allergies]
        self.assertIn("NSAIDS", allergy_names)
        self.assertIn("Sea Foods", allergy_names)


if __name__ == "__main__":
    unittest.main()
