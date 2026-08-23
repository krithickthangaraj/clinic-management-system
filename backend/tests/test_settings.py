import unittest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole
from app.models.settings import HospitalSettings
from app.core.security import get_password_hash
from app.schemas.settings import (
    HospitalSettingsUpdate, StaffCreate, StaffUpdate, StaffPasswordReset,
    ProfileUpdate, ChangePasswordRequest,
    DictionaryTermCreate, DictionaryTermUpdate
)
from app.api.v1.endpoints.settings import (
    get_hospital_settings, update_hospital_settings,
    list_staff, create_staff, update_staff, toggle_staff_status, admin_reset_password,
    list_dictionary_terms, add_dictionary_term, update_dictionary_term, deactivate_dictionary_term,
    get_my_profile, update_my_profile, change_my_password
)


class TestSettingsEndpoints(unittest.TestCase):
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
        self.db.query(HospitalSettings).delete()
        self.db.query(User).delete()
        self.db.commit()

        # Create Admin User
        self.admin_user = User(
            username="admin_test",
            hashed_password=get_password_hash("pass123"),
            full_name="Hospital Administrator",
            role=UserRole.ADMIN.value,
            email="admin@test.com",
            is_active=True
        )
        self.db.add(self.admin_user)
        self.db.commit()
        self.db.refresh(self.admin_user)

    def tearDown(self):
        self.db.close()

    def test_01_get_and_update_hospital_settings(self):
        # 1. Get initial settings (creates default)
        settings = asyncio.run(get_hospital_settings(db=self.db, current_user=self.admin_user))
        self.assertEqual(settings.hospital_name, "AEREN CLINIC & HEALTHCARE")

        # 2. Update hospital settings
        update_payload = HospitalSettingsUpdate(
            hospital_name="APOLLO SPECTRUM CLINIC",
            tagline="Advanced Multispecialty Care",
            phone="+91 99999 88888",
            email="info@apollospectrum.com",
            address="456 Healthcare Avenue, City Center",
            website="www.apollospectrum.com",
            registration_number="REG-TN-2025-9999"
        )
        updated = asyncio.run(update_hospital_settings(data=update_payload, db=self.db, current_user=self.admin_user))
        self.assertEqual(updated.hospital_name, "APOLLO SPECTRUM CLINIC")
        self.assertEqual(updated.phone, "+91 99999 88888")

    def test_02_staff_crud_lifecycle(self):
        # 1. Create Staff
        staff_payload = StaffCreate(
            username="dr_smith",
            password="doctorpassword123",
            full_name="Dr. Alan Smith",
            role="doctor",
            email="drsmith@test.com",
            phone="+91 91234 56789",
            department="General Medicine",
            qualification="MBBS, MD (Gen Med)"
        )
        staff = asyncio.run(create_staff(data=staff_payload, db=self.db, current_user=self.admin_user))
        staff_id = staff.id
        self.assertEqual(staff.username, "dr_smith")
        self.assertEqual(staff.role, "doctor")

        # 2. List Staff
        users = asyncio.run(list_staff(role=None, search=None, db=self.db, current_user=self.admin_user))
        self.assertTrue(len(users) >= 2)

        # 3. Update Staff
        update_payload = StaffUpdate(
            department="Internal Medicine",
            qualification="MBBS, MD, FRCP"
        )
        updated_staff = asyncio.run(update_staff(user_id=staff_id, data=update_payload, db=self.db, current_user=self.admin_user))
        self.assertEqual(updated_staff.department, "Internal Medicine")

        # 4. Toggle Status (Deactivate)
        deact_staff = asyncio.run(toggle_staff_status(user_id=staff_id, db=self.db, current_user=self.admin_user))
        self.assertFalse(deact_staff.is_active)

        # 5. Reset Password
        reset_res = asyncio.run(admin_reset_password(
            user_id=staff_id,
            data=StaffPasswordReset(new_password="brandnewpassword123"),
            db=self.db,
            current_user=self.admin_user
        ))
        self.assertIn("Password reset successfully", reset_res["message"])

    def test_03_clinical_dictionary_lifecycle(self):
        # 1. Add term to Complaints
        term = asyncio.run(add_dictionary_term(
            category="complaints",
            data=DictionaryTermCreate(name="Acute Migraine Headache"),
            db=self.db,
            current_user=self.admin_user
        ))
        term_id = term.id
        self.assertEqual(term.name, "Acute Migraine Headache")

        # 2. List terms in Complaints
        terms = asyncio.run(list_dictionary_terms(category="complaints", search=None, include_inactive=False, db=self.db, current_user=self.admin_user))
        self.assertTrue(any(t.name == "Acute Migraine Headache" for t in terms))

        # 3. Update term
        up_term = asyncio.run(update_dictionary_term(
            category="complaints",
            item_id=term_id,
            data=DictionaryTermUpdate(name="Severe Migraine Headache with Aura"),
            db=self.db,
            current_user=self.admin_user
        ))
        self.assertEqual(up_term.name, "Severe Migraine Headache with Aura")

        # 4. Deactivate term
        del_res = asyncio.run(deactivate_dictionary_term(
            category="complaints",
            item_id=term_id,
            db=self.db,
            current_user=self.admin_user
        ))
        self.assertIn("deactivated successfully", del_res["message"])

        # 5. Add term to Procedures & Referrals
        proc_term = asyncio.run(add_dictionary_term(
            category="procedures",
            data=DictionaryTermCreate(name="Nebulization & Inhalation Therapy"),
            db=self.db,
            current_user=self.admin_user
        ))
        self.assertEqual(proc_term.name, "Nebulization & Inhalation Therapy")

        ref_term = asyncio.run(add_dictionary_term(
            category="referrals",
            data=DictionaryTermCreate(name="Dr. Sarah Rao", specialty="Cardiology"),
            db=self.db,
            current_user=self.admin_user
        ))
        self.assertEqual(ref_term.name, "Dr. Sarah Rao")
        self.assertEqual(ref_term.specialty, "Cardiology")

    def test_04_profile_management(self):
        # 1. Get Profile
        profile = asyncio.run(get_my_profile(current_user=self.admin_user))
        self.assertEqual(profile.username, "admin_test")

        # 2. Update Profile
        up_profile = asyncio.run(update_my_profile(
            data=ProfileUpdate(full_name="Chief Executive Administrator", phone="+91 99887 76655"),
            db=self.db,
            current_user=self.admin_user
        ))
        self.assertEqual(up_profile.full_name, "Chief Executive Administrator")


if __name__ == "__main__":
    unittest.main()
