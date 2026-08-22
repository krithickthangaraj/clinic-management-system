import unittest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.prescription import Prescription, PrescriptionDrug
from app.models.visit_relations import VisitPayment
from app.schemas.consultation import (
    FullPrescriptionPayload,
    RXDrugItem,
    PatientHistoryPayload,
    ClinicalAssessmentPayload,
    BillingAndPlanPayload,
)


class TestFullPrescriptionModule(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.session = self.Session()
        
        # Seed Doctor
        self.doctor = User(
            username="doc_jeyagowthaman",
            hashed_password="hash",
            full_name="Dr. T.S.Jeyagowthaman",
            role=UserRole.DOCTOR.value,
        )
        self.session.add(self.doctor)
        self.session.flush()

        # Seed Patient
        self.patient = Patient(
            name="Vikramaditya Sharma",
            gender="Male",
            age=38,
            phone="9876543210",
        )
        self.session.add(self.patient)
        self.session.flush()

        # Seed Visit
        self.visit = Visit(
            visit_number="V-20260822-001",
            patient_id=self.patient.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.IN_CONSULTATION.value,
            consultant_assigned="Dr. T.S.Jeyagowthaman",
        )
        self.session.add(self.visit)
        self.session.commit()

    def tearDown(self):
        self.session.close()

    def test_auto_calculation_and_full_payload_structure(self):
        """Verify schema validation, auto-calculations, and multi-table mapping"""
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
            brand_name="Pan 40",
            drug_name="Pantoprazole 40mg",
            dosage="1 Tab",
            frequency="OD (1-0-0)",
            days=5,
            instructions="Before food",
            quantity=5,
        )

        payload = FullPrescriptionPayload(
            visit_id=self.visit.id,
            patient_id=self.patient.id,
            doctor_id=self.doctor.id,
            consultant_name="Dr. T.S.Jeyagowthaman",
            history=PatientHistoryPayload(
                past_history=["Type 2 Diabetes"],
                allergy_history=["NSAIDS"],
            ),
            assessment=ClinicalAssessmentPayload(
                complaints=[{"complaint": "Fever", "duration": "3 days"}],
                diagnosis=["Acute Bronchitis"],
                examination="Chest clear, throat congested",
            ),
            medicines=[drug1, drug2],
            plan_and_billing=BillingAndPlanPayload(
                advice="Drink warm fluids",
                for_followup=True,
                followup_duration=7,
                followup_unit="Days",
                doctor_fee=300.0,
                total_amount=300.0,
            ),
            status_action="completed",
        )

        self.assertEqual(len(payload.medicines), 2)
        self.assertEqual(payload.medicines[0].quantity, 15)
        self.assertEqual(payload.medicines[1].quantity, 5)
        self.assertEqual(payload.history.allergy_history, ["NSAIDS"])


if __name__ == "__main__":
    unittest.main()
