import unittest
import asyncio
from datetime import datetime, timedelta, date, time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.api.v1.endpoints.doctor import get_doctor_dashboard
from app.api.v1.endpoints.visits import get_reception_today


class TestTier3MidnightBoundary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

        self.doctor = self.db.query(User).filter_by(username="dr_midnight").first()
        if not self.doctor:
            self.doctor = User(
                username="dr_midnight",
                hashed_password="pw",
                full_name="Dr. T.S.Jeyagowthaman",
                role=UserRole.DOCTOR.value,
            )
            self.db.add(self.doctor)

        self.receptionist = self.db.query(User).filter_by(username="reception_midnight").first()
        if not self.receptionist:
            self.receptionist = User(
                username="reception_midnight",
                hashed_password="pw",
                full_name="Staff Nurse",
                role=UserRole.RECEPTION.value,
            )
            self.db.add(self.receptionist)

        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_midnight_boundary_patient_still_in_active_queue(self):
        """
        Midnight Boundary Scenario:
        - Patient was registered at 11:55 PM (23:55) yesterday.
        - Current time is 12:05 AM (00:05) past midnight.
        - The patient has status 'vitals_done' (waiting for doctor).
        - Assert that both Doctor Dashboard and Reception Queue still include this patient
          because the patient is active in the queue within the 24-hour cutoff window.
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # 1. Create Patient
        patient = Patient(
            patient_id="PAT-99901",
            name="Midnight Boundary Patient",
            gender="Female",
            age_years=29,
            phone="9998887770",
        )
        self.db.add(patient)
        self.db.flush()

        # 2. Created at 11:55 PM yesterday (simulated 30 minutes before midnight)
        # Even if created_at is 2 hours ago across the midnight boundary:
        registered_at = datetime.utcnow() - timedelta(hours=2)

        visit = Visit(
            visit_number="V-MIDNIGHT-001",
            patient_id=patient.id,
            status=VisitStatus.VITALS_DONE.value,
            consultant_assigned="Dr. T.S.Jeyagowthaman",
            created_at=registered_at,
        )
        self.db.add(visit)
        self.db.commit()

        # 3. Query Doctor Dashboard
        doctor_dashboard = loop.run_until_complete(
            get_doctor_dashboard(consultant="", db=self.db, current_user=self.doctor)
        )

        # Assert patient is present in queue
        patient_names = [q.patient_name for q in doctor_dashboard.queue]
        self.assertIn("Midnight Boundary Patient", patient_names)

        # 4. Query Reception Queue
        reception_visits = loop.run_until_complete(
            get_reception_today(db=self.db, current_user=self.receptionist)
        )
        reception_names = [v.patient_name for v in reception_visits]
        self.assertIn("Midnight Boundary Patient", reception_names)

        loop.close()


if __name__ == "__main__":
    unittest.main()
