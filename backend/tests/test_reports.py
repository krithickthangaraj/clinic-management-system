import unittest
import asyncio
from datetime import datetime, date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.prescription import Prescription, PrescriptionDrug
from app.models.visit_relations import VisitDiagnosis
from app.models.enums import UserRole, VisitStatus
from app.api.v1.endpoints.reports import get_operational_analytics, get_daily_op_report


class TestReportsEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()
        self.db.query(PrescriptionDrug).delete()
        self.db.query(Prescription).delete()
        self.db.query(VisitDiagnosis).delete()
        self.db.query(Visit).delete()
        self.db.query(Patient).delete()
        self.db.query(User).delete()
        self.db.commit()

        # Seed Doctor
        self.doctor = User(
            username="doctor_report",
            hashed_password="pw",
            full_name="Dr. Priya Mohan",
            role=UserRole.DOCTOR.value,
            email="drpriya@test.com",
            is_active=True
        )
        self.db.add(self.doctor)
        self.db.commit()
        self.db.refresh(self.doctor)

        # Seed Patients & Visits
        self.patient1 = Patient(
            patient_id="PAT-1001",
            name="Rahul Sharma",
            age=34,
            gender="Male",
            phone="9876543210"
        )
        self.patient2 = Patient(
            patient_id="PAT-1002",
            name="Ananya Verma",
            age=28,
            gender="Female",
            phone="9876543211"
        )
        self.db.add_all([self.patient1, self.patient2])
        self.db.commit()
        self.db.refresh(self.patient1)
        self.db.refresh(self.patient2)

        # Create Visits
        now = datetime.utcnow()
        self.visit1 = Visit(
            visit_number="OP-001",
            patient_id=self.patient1.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.COMPLETED.value,
            diagnosis="Acute Viral Pharyngitis",
            chief_complaints="Fever, Sore throat for 3 days",
            created_at=now - timedelta(minutes=45),
            updated_at=now
        )
        self.visit2 = Visit(
            visit_number="OP-002",
            patient_id=self.patient2.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.IN_CONSULTATION.value,
            diagnosis="Essential Hypertension",
            chief_complaints="Headache and dizziness",
            created_at=now - timedelta(minutes=20),
            updated_at=now
        )
        self.db.add_all([self.visit1, self.visit2])
        self.db.commit()
        self.db.refresh(self.visit1)
        self.db.refresh(self.visit2)

        # Create Prescription & Drugs
        self.rx = Prescription(
            visit_id=self.visit1.id,
            doctor_id=self.doctor.id,
            created_at=now
        )
        self.db.add(self.rx)
        self.db.commit()
        self.db.refresh(self.rx)

        drug1 = PrescriptionDrug(
            prescription_id=self.rx.id,
            drug_name="Paracetamol 650mg",
            dosage="1 Tab",
            frequency="TDS (1-1-1)",
            number_of_days=3
        )
        drug2 = PrescriptionDrug(
            prescription_id=self.rx.id,
            drug_name="Amoxicillin 500mg",
            dosage="1 Cap",
            frequency="BD (1-0-1)",
            number_of_days=5
        )
        self.db.add_all([drug1, drug2])

        # Diagnoses relations
        diag1 = VisitDiagnosis(visit_id=self.visit1.id, custom_diagnosis="Acute Viral Pharyngitis")
        diag2 = VisitDiagnosis(visit_id=self.visit2.id, custom_diagnosis="Essential Hypertension")
        self.db.add_all([diag1, diag2])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_01_operational_analytics_payload(self):
        analytics = asyncio.run(get_operational_analytics(db=self.db, current_user=self.doctor))
        self.assertEqual(len(analytics.patient_flow_7d), 7)
        self.assertTrue(analytics.total_patients_7d >= 2)
        self.assertTrue(analytics.total_completed_7d >= 1)

        # Bottlenecks
        self.assertGreater(analytics.bottlenecks.avg_wait_time_minutes, 0)
        self.assertGreater(analytics.bottlenecks.avg_consultation_time_minutes, 0)

        # Top Drugs
        top_drugs = [d.name for d in analytics.top_prescribed_drugs]
        self.assertIn("Paracetamol 650mg", top_drugs)

        # Top Diagnoses
        top_diags = [d.name for d in analytics.top_diagnoses]
        self.assertTrue("Acute Viral Pharyngitis" in top_diags or "Essential Hypertension" in top_diags)

    def test_02_daily_op_report_payload(self):
        today_str = date.today().strftime("%Y-%m-%d")
        report = asyncio.run(get_daily_op_report(report_date=today_str, db=self.db, current_user=self.doctor))
        self.assertEqual(report.report_date, today_str)
        self.assertEqual(report.total_registered, 2)
        self.assertEqual(report.total_completed, 1)
        self.assertEqual(report.total_pending, 1)
        self.assertEqual(len(report.items), 2)
        self.assertEqual(report.items[0].patient_name, "Rahul Sharma")
        self.assertEqual(report.items[0].doctor_name, "Dr. Priya Mohan")


if __name__ == "__main__":
    unittest.main()
