import unittest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import get_password_hash
from app.schemas.user import LoginRequest
from app.api.v1.endpoints.auth import login, get_current_user_info


class TestAuthFlow(unittest.TestCase):
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
        self.db.query(User).delete()
        self.db.commit()

        # 1. Seed Active Doctor
        self.doctor = User(
            username="doctor_auth",
            hashed_password=get_password_hash("doctor123"),
            full_name="Dr. Priya Mohan",
            role=UserRole.DOCTOR.value,
            email="drpriya@test.com",
            is_active=True
        )

        # 2. Seed Active Admin
        self.admin = User(
            username="admin_auth",
            hashed_password=get_password_hash("admin123"),
            full_name="Hospital Administrator",
            role=UserRole.ADMIN.value,
            email="admin@test.com",
            is_active=True
        )

        # 3. Seed Deactivated User
        self.inactive_user = User(
            username="inactive_staff",
            hashed_password=get_password_hash("staff123"),
            full_name="Former Staff",
            role=UserRole.RECEPTION.value,
            email="former@test.com",
            is_active=False
        )

        self.db.add_all([self.doctor, self.admin, self.inactive_user])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_01_valid_doctor_login_and_role(self):
        login_req = LoginRequest(username="doctor_auth", password="doctor123")
        response = asyncio.run(login(login_data=login_req, db=self.db))
        self.assertIn("access_token", response)
        self.assertEqual(response["token_type"], "bearer")
        self.assertEqual(response["user"].role, "doctor")
        self.assertEqual(response["user"].username, "doctor_auth")

    def test_02_valid_admin_login_and_role(self):
        login_req = LoginRequest(username="admin_auth", password="admin123")
        response = asyncio.run(login(login_data=login_req, db=self.db))
        self.assertEqual(response["user"].role, "admin")

    def test_03_invalid_password_returns_401(self):
        login_req = LoginRequest(username="doctor_auth", password="wrongpassword")
        with self.assertRaises(HTTPException) as cm:
            asyncio.run(login(login_data=login_req, db=self.db))
        self.assertEqual(cm.exception.status_code, 401)
        self.assertIn("Incorrect username or password", cm.exception.detail)

    def test_04_inactive_user_cannot_login(self):
        login_req = LoginRequest(username="inactive_staff", password="staff123")
        with self.assertRaises(HTTPException) as cm:
            asyncio.run(login(login_data=login_req, db=self.db))
        self.assertEqual(cm.exception.status_code, 403)
        self.assertIn("inactive", cm.exception.detail)


if __name__ == "__main__":
    unittest.main()
