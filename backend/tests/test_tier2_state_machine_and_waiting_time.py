import unittest
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.schemas.patient import PatientCreate
from app.schemas.consultation import (
    FullPrescriptionPayload,
    RXDrugItem,
    ClinicalAssessmentPayload,
    BillingAndPlanPayload,
)
from app.services.patient_service import register_patient_with_visit
from app.api.v1.endpoints.doctor import calculate_waiting_time
from app.api.v1.endpoints.prescriptions import save_full_prescription, get_full_prescription


class TestTier2StateMachineAndWaitingTime(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

        self.doctor = self.db.query(User).filter_by(username="dr_statemachine").first()
        if not self.doctor:
            self.doctor = User(
                username="dr_statemachine",
                hashed_password="pw",
                full_name="Dr. T.S.Jeyagowthaman",
                role=UserRole.DOCTOR.value,
            )
            self.db.add(self.doctor)
            self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_visit_status_progression_lifecycle(self):
        """
        Verify strict state transitions:
        1. Registration without vitals -> status = REGISTERED
        2. Registration with vitals -> status = VITALS_DONE
        3. Doctor consultation draft save -> status = IN_CONSULTATION
        4. Doctor completes consultation -> status = COMPLETED
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # 1. Registration without vitals
        p1_data = PatientCreate(name="State Test One", phone="9111111111", age_years=40)
        pat1, visit1, vitals1 = register_patient_with_visit(
            db=self.db,
            patient_data=p1_data,
            vitals_data=None,
        )
        self.assertEqual(visit1.status, VisitStatus.REGISTERED.value)

        # 2. Registration with vitals
        p2_data = PatientCreate(name="State Test Two", phone="9222222222", age_years=25)
        vitals2_dict = {"bp_systolic": 120, "bp_diastolic": 80, "weight_kg": 60.0}
        pat2, visit2, vitals2 = register_patient_with_visit(
            db=self.db,
            patient_data=p2_data,
            vitals_data=vitals2_dict,
        )
        self.assertEqual(visit2.status, VisitStatus.VITALS_DONE.value)

        # 3. Doctor draft save (status_action = "save")
        draft_payload = FullPrescriptionPayload(
            visit_id=visit2.id,
            patient_id=pat2.id,
            doctor_id=self.doctor.id,
            assessment=ClinicalAssessmentPayload(complaints=[{"complaint": "Headache", "duration": "1 Day"}]),
            status_action="save",
        )
        draft_res = loop.run_until_complete(
            save_full_prescription(payload=draft_payload, db=self.db, current_user=self.doctor)
        )
        self.assertEqual(draft_res.status, VisitStatus.IN_CONSULTATION.value)

        # 4. Doctor completes consultation (status_action = "completed")
        complete_payload = FullPrescriptionPayload(
            visit_id=visit2.id,
            patient_id=pat2.id,
            doctor_id=self.doctor.id,
            assessment=ClinicalAssessmentPayload(diagnosis=["Migraine"]),
            medicines=[
                RXDrugItem(brand_name="Vasograin", drug_name="Ergotamine + Caffeine", dosage="1 Tab", days=3)
            ],
            status_action="completed",
            print_requested=True,
        )
        complete_res = loop.run_until_complete(
            save_full_prescription(payload=complete_payload, db=self.db, current_user=self.doctor)
        )
        self.assertEqual(complete_res.status, VisitStatus.COMPLETED.value)
        self.assertIsNotNone(complete_res.printed_at)

        loop.close()

    def test_waiting_time_stops_and_is_permanently_frozen_on_completed(self):
        """
        Verify that:
        - An active visit waiting time increases over time.
        - Once a visit is COMPLETED, calculate_waiting_time returns a FIXED duration
          and never increases even if hours elapse.
        """
        created_time = datetime.utcnow() - timedelta(minutes=45)
        completed_time = created_time + timedelta(minutes=18)

        # Active visit (status = 'vitals_done')
        active_str, active_mins = calculate_waiting_time(
            created_at=created_time,
            end_time=None,
            status=VisitStatus.VITALS_DONE.value,
        )
        # Should be ~45 minutes elapsed
        self.assertGreaterEqual(active_mins, 44)
        self.assertIn("min", active_str)

        # Completed visit (status = 'completed')
        frozen_str, frozen_mins = calculate_waiting_time(
            created_at=created_time,
            end_time=completed_time,
            status=VisitStatus.COMPLETED.value,
        )
        # Should be frozen exactly at 18 minutes!
        self.assertEqual(frozen_mins, 18)
        self.assertEqual(frozen_str, "18 min")


if __name__ == "__main__":
    unittest.main()
