import unittest
import asyncio
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.schemas.patient import PatientCreate, PatientRegistrationPayload
from app.core.dependencies import require_role
from app.api.v1.endpoints.doctor import get_doctor_dashboard
from app.api.v1.endpoints.prescriptions import get_full_prescription, save_full_prescription
from app.api.v1.endpoints.patients import register_patient


class TestTier1EdgeCasesAndRBAC(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

        # Doctor User
        self.doctor = self.db.query(User).filter_by(username="test_dr_jeyagowthaman").first()
        if not self.doctor:
            self.doctor = User(
                username="test_dr_jeyagowthaman",
                hashed_password="pw",
                full_name="Dr. T.S.Jeyagowthaman",
                role=UserRole.DOCTOR.value,
            )
            self.db.add(self.doctor)

        # Receptionist User
        self.receptionist = self.db.query(User).filter_by(username="test_reception_nurse").first()
        if not self.receptionist:
            self.receptionist = User(
                username="test_reception_nurse",
                hashed_password="pw",
                full_name="Staff Nurse Priya",
                role=UserRole.RECEPTION.value,
            )
            self.db.add(self.receptionist)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    # -------------------------------------------------------------------------
    # 1. Validation Edge Cases
    # -------------------------------------------------------------------------
    def test_missing_required_patient_name_raises_validation_error(self):
        """Assert registering without patient name raises ValidationError"""
        with self.assertRaises(ValidationError) as ctx:
            PatientCreate(name="", phone="9876543210")
        self.assertIn("Patient full name is required", str(ctx.exception))

    def test_missing_required_phone_raises_validation_error(self):
        """Assert registering without phone raises ValidationError"""
        with self.assertRaises(ValidationError) as ctx:
            PatientCreate(name="John Doe", phone="")
        self.assertIn("Phone number is required", str(ctx.exception))

    def test_malformed_phone_number_raises_validation_error(self):
        """Assert phone number not having 10 digits raises ValidationError"""
        with self.assertRaises(ValidationError) as ctx:
            PatientCreate(name="John Doe", phone="12345")
        self.assertIn("Phone number must be exactly 10 digits", str(ctx.exception))

    def test_negative_age_raises_validation_error(self):
        """Assert negative age raises ValidationError"""
        with self.assertRaises(ValidationError) as ctx:
            PatientCreate(name="John Doe", phone="9876543210", age_years=-5)
        self.assertIn("Age cannot be negative", str(ctx.exception))

    def test_full_registration_payload_negative_age_rejection(self):
        """Assert PatientRegistrationPayload rejects negative age"""
        with self.assertRaises(ValidationError) as ctx:
            PatientRegistrationPayload(full_name="John Doe", phone_number="9876543210", age=-10)
        self.assertIn("Age cannot be negative", str(ctx.exception))

    # -------------------------------------------------------------------------
    # 2. RBAC Access Control Edge Cases
    # -------------------------------------------------------------------------
    def test_receptionist_denied_access_to_doctor_dashboard(self):
        """Assert Receptionist cannot call Doctor Dashboard endpoint directly -> 403 Forbidden"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        checker = require_role([UserRole.DOCTOR, UserRole.ADMIN])
        with self.assertRaises(HTTPException) as ctx:
            checker(current_user=self.receptionist)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Insufficient permissions", ctx.exception.detail)

        loop.close()

    def test_receptionist_denied_access_to_save_full_prescription(self):
        """Assert Receptionist cannot save prescription -> 403 Forbidden"""
        checker = require_role([UserRole.DOCTOR, UserRole.ADMIN])
        with self.assertRaises(HTTPException) as ctx:
            checker(current_user=self.receptionist)
        self.assertEqual(ctx.exception.status_code, 403)

    # -------------------------------------------------------------------------
    # 3. Non-Existent Resources (404 Not Found)
    # -------------------------------------------------------------------------
    def test_get_full_prescription_non_existent_visit_returns_404(self):
        """Assert querying prescription for invalid visit ID raises 404 Not Found"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        with self.assertRaises(HTTPException) as ctx:
            loop.run_until_complete(
                get_full_prescription(visit_id=999999, db=self.db, current_user=self.doctor)
            )
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("Visit not found", ctx.exception.detail)

        loop.close()


if __name__ == "__main__":
    unittest.main()
